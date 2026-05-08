/**
 * Initialize all scheduled tasks on application startup
 * This module should be imported in your Next.js app initialization
 * 
 * Usage: Add to your app/layout.tsx or create a middleware
 */

import { initializeScheduler } from '@/lib/scraping/scheduler';

/**
 * Initialize all background jobs and scheduled tasks
 * Call this function once when your application starts
 */
export async function initializeBackgroundJobs() {
  console.log('[BackgroundJobs] Initializing background jobs...');

  try {
    // Initialize product sync scheduler (runs every Sunday 8 AM Kuwait time)
    initializeScheduler();
    console.log('[BackgroundJobs] Product sync scheduler initialized');

    // Add more schedulers here in the future
    // For example: notifications, email digests, cleanup tasks, etc.

    console.log('[BackgroundJobs] All background jobs initialized successfully');
  } catch (error) {
    console.error('[BackgroundJobs] Failed to initialize background jobs:', error);
    // Don't crash the app if job initialization fails
    // Just log the error and continue
  }
}

/**
 * Cleanup function to stop all scheduled tasks
 * Call this when the application is shutting down
 */
export async function cleanupBackgroundJobs() {
  console.log('[BackgroundJobs] Cleaning up background jobs...');

  // Add cleanup logic here when needed
}
