export const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const formatTimeWithSeconds = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateProductiveHours = (totalMinutes, idleMinutes) => {
  return Math.max(0, (totalMinutes - idleMinutes) / 60);
};

export const generateDummyScreenshots = (count) => {
  const screenshots = [];
  for (let i = 0; i < count; i++) {
    screenshots.push(`https://picsum.photos/400/300?random=${Date.now() + i}`);
  }
  return screenshots;
};
// export function formatDecimalHoursToHHMM(decimalHours) {
//   const totalMinutes = Math.round(decimalHours * 60);
//   const hours = Math.floor(totalMinutes / 60);
//   const minutes = totalMinutes % 60;
//   return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
// }
export function formatDecimalHoursToHHMM(decimalHours) {
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hr' : 'hrs'}`);
  if (minutes > 0) parts.push(`${minutes} min`);

  return parts.length > 0 ? parts.join(' ') : '0 min';
}


export const handleFirebaseError = (error) => {
  let msg = error.message;
  if (msg.includes("auth/email-already-in-use")) {
    msg = "Email already in use";
  } else if (msg.includes("auth/invalid-email")) {
    msg = "Invalid email";
  } else if (msg.includes("auth/weak-password")) {
    msg = "Password should be at least 6 characters";
  } else if (msg.includes("auth/user-not-found")) {
    msg = "User not found";
  } else if (msg.includes("auth/invalid-credential")) {
    msg = "Invalid credentials";
  } else if (msg.includes("auth/too-many-requests")) {
    msg = "Too many requests, please try again later";
  } else if (msg.includes("auth/network-request-failed")) {
    msg = "Network request failed, please try again later";
  }

  return msg;
};
