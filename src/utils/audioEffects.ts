export const playSound = (frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.log('Audio not available');
  }
};

export const playGunshot = () => {
  playSound(200, 0.1, 'square');
  setTimeout(() => playSound(150, 0.05, 'square'), 50);
};

export const playKick = () => {
  playSound(80, 0.2, 'triangle');
};

export const playThrow = () => {
  playSound(300, 0.3, 'sine');
  setTimeout(() => playSound(250, 0.2), 100);
};

export const playCry = () => {
  playSound(400, 0.5, 'sine');
  setTimeout(() => playSound(450, 0.3), 200);
  setTimeout(() => playSound(380, 0.4), 400);
};

export const playRun = () => {
  playSound(120, 0.1, 'triangle');
  setTimeout(() => playSound(140, 0.1, 'triangle'), 100);
  setTimeout(() => playSound(120, 0.1, 'triangle'), 200);
};