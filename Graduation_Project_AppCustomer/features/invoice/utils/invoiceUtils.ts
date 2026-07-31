export const getAvailableReminderOptions = (selectedDate: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(selectedDate);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const options = ['Đúng ngày'];
  if (diffDays >= 1) options.push('Trước 1 ngày');
  if (diffDays >= 2) options.push('Trước 2 ngày');
  if (diffDays >= 3) options.push('Trước 3 ngày');
  
  return options;
};
