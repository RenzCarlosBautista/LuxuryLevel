-- PostgreSQL RPC Function to Approve and Map Staging Products
CREATE OR REPLACE FUNCTION approve_and_map_product(
  p_staging_id INT,
  p_approved_by TEXT DEFAULT 'system'
)
RETURNS JSON AS $$
DECLARE
  v_staging_row RECORD;
  v_brand_id INT;
  v_category_id INT;
  v_product_id INT;
  v_existing_product_id INT;
  v_sync_status TEXT;
  v_result JSON;
BEGIN
  -- Start transaction
  BEGIN
    -- 1. Fetch the staging row
    SELECT * INTO v_staging_row FROM staging_products WHERE id = p_staging_id;
    
    IF v_staging_row IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Staging product not found',
        'staging_id', p_staging_id
      );
    END IF;

    -- 2. Handle Brand Mapping (case-insensitive)
    SELECT id INTO v_brand_id 
    FROM brand 
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(v_staging_row.raw_brand_name))
    LIMIT 1;

    IF v_brand_id IS NULL THEN
      -- Insert new brand
      INSERT INTO brand (name, description, featured)
      VALUES (
        TRIM(v_staging_row.raw_brand_name),
        'Auto-imported from web scraper',
        false
      )
      RETURNING id INTO v_brand_id;
    END IF;

    -- 3. Handle Category Mapping (case-insensitive)
    SELECT id INTO v_category_id 
    FROM category 
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(v_staging_row.raw_category_name))
    LIMIT 1;

    IF v_category_id IS NULL THEN
      -- Insert new category
      INSERT INTO category (name, description)
      VALUES (
        TRIM(v_staging_row.raw_category_name),
        'Auto-imported from web scraper'
      )
      RETURNING id INTO v_category_id;
    END IF;

    -- 4. Check if product already exists by ref_no
    SELECT id INTO v_existing_product_id 
    FROM product 
    WHERE ref_no = v_staging_row.scraped_ref_no;

    -- 5. Upsert into product table
    IF v_existing_product_id IS NOT NULL THEN
      -- Update existing product
      UPDATE product
      SET 
        name = COALESCE(v_staging_row.scraped_name, name),
        price = COALESCE(v_staging_row.scraped_price, price),
        brand_id = v_brand_id,
        category_id = v_category_id,
        updated_at = NOW()
      WHERE id = v_existing_product_id
      RETURNING id INTO v_product_id;
      
      v_sync_status := 'price_updated';
    ELSE
      -- Insert new product
      INSERT INTO product (ref_no, name, description, price, brand_id, category_id, created_at, updated_at)
      VALUES (
        v_staging_row.scraped_ref_no,
        v_staging_row.scraped_name,
        'Imported from web scraper',
        v_staging_row.scraped_price,
        v_brand_id,
        v_category_id,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_product_id;
      
      v_sync_status := 'new_product';
    END IF;

    -- 6. Log the approval action
    INSERT INTO product_sync_log (staging_id, action, product_id, brand_id, category_id, details, created_by)
    VALUES (
      p_staging_id,
      'approved',
      v_product_id,
      v_brand_id,
      v_category_id,
      json_build_object(
        'sync_status', v_sync_status,
        'original_price', v_staging_row.scraped_price,
        'brand_name', v_staging_row.raw_brand_name,
        'category_name', v_staging_row.raw_category_name
      ),
      p_approved_by
    );

    -- 7. Delete the staging row
    DELETE FROM staging_products WHERE id = p_staging_id;

    -- 8. Return success response
    v_result := json_build_object(
      'success', true,
      'staging_id', p_staging_id,
      'product_id', v_product_id,
      'brand_id', v_brand_id,
      'category_id', v_category_id,
      'sync_status', v_sync_status,
      'message', 'Product successfully synced from staging'
    );

    RETURN v_result;

  EXCEPTION WHEN OTHERS THEN
    -- Log error and return failure
    UPDATE staging_products 
    SET 
      sync_status = 'error',
      error_message = SQLERRM
    WHERE id = p_staging_id;

    RETURN json_build_object(
      'success', false,
      'staging_id', p_staging_id,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to reject a staging product
CREATE OR REPLACE FUNCTION reject_staging_product(
  p_staging_id INT,
  p_rejected_by TEXT DEFAULT 'system',
  p_rejection_reason TEXT DEFAULT 'Manual rejection'
)
RETURNS JSON AS $$
DECLARE
  v_staging_row RECORD;
BEGIN
  -- Fetch the staging row
  SELECT * INTO v_staging_row FROM staging_products WHERE id = p_staging_id;
  
  IF v_staging_row IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Staging product not found',
      'staging_id', p_staging_id
    );
  END IF;

  -- Log the rejection
  INSERT INTO product_sync_log (staging_id, action, details, created_by)
  VALUES (
    p_staging_id,
    'rejected',
    json_build_object(
      'reason', p_rejection_reason,
      'product_name', v_staging_row.scraped_name,
      'ref_no', v_staging_row.scraped_ref_no
    ),
    p_rejected_by
  );

  -- Delete the staging row
  DELETE FROM staging_products WHERE id = p_staging_id;

  RETURN json_build_object(
    'success', true,
    'staging_id', p_staging_id,
    'message', 'Staging product rejected and removed'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'staging_id', p_staging_id,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;
