/**
 * Plays a notification sound
 */
export function playNotificationSound(): void {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5; // Set volume to 50%
    audio.play().catch((error) => {
      console.warn('Failed to play notification sound:', error);
    });
  } catch (error) {
    console.warn('Error playing notification sound:', error);
  }
}
