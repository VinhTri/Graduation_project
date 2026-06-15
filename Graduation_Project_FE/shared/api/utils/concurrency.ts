/**
 * Hàm tiện ích để chạy nhiều API cùng lúc (đồng thời).
 * Nếu có BẤT KỲ một API nào bị lỗi, toàn bộ tiến trình sẽ dừng và báo lỗi ngay lập tức.
 *
 * @param promises Mảng chứa các hàm gọi API (promises) cần chạy đồng thời.
 * @returns Mảng chứa kết quả trả về của các API theo đúng thứ tự.
 */
export const runConcurrent = async <T extends any[]>(promises: [...T]): Promise<{ [K in keyof T]: Awaited<T[K]> }> => {
  return Promise.all(promises) as Promise<{ [K in keyof T]: Awaited<T[K]> }>;
};

/**
 * Hàm tiện ích để chạy nhiều API cùng lúc (đồng thời), nhưng KHÔNG dừng lại nếu có lỗi.
 * Nó sẽ đợi tất cả API chạy xong và trả về trạng thái ('thành công' hoặc 'thất bại') của từng API.
 *
 * @param promises Mảng chứa các hàm gọi API (promises) cần chạy đồng thời.
 * @returns Mảng chứa kết quả (bao gồm trạng thái thành công/lỗi) của từng API.
 */
export const runConcurrentSettled = async <T extends any[]>(
  promises: [...T]
): Promise<{ [K in keyof T]: PromiseSettledResult<Awaited<T[K]>> }> => {
  return Promise.allSettled(promises) as unknown as Promise<{ [K in keyof T]: PromiseSettledResult<Awaited<T[K]>> }>;
};
