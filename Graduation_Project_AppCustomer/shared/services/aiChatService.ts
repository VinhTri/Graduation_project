import { axiosClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export interface ActionPrompt {
  question: string;
  actions: {
    label: string;
    route?: string;
    prompt?: string;
  }[];
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  moduleType?: 'RAG' | 'ANALYTICS' | 'RECOMMENDATION';
  actionPrompt?: ActionPrompt;
  cards?: {
    type: 'METRICS' | 'BUDGET_SPLIT' | 'GOAL_PLAN';
    title: string;
    items: { label: string; value: string; color?: string }[];
  }[];
}

export interface QuickSuggestion {
  id: string;
  label: string;
  category: 'RAG' | 'ANALYTICS' | 'RECOMMENDATION';
  prompt: string;
}

export const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  { id: '1', label: 'Tư vấn tài chính cho tôi', category: 'RECOMMENDATION', prompt: 'Tư vấn tài chính hiện tại cho tôi' },
  { id: '2', label: 'Chia lương 12tr, thuê 3tr', category: 'RECOMMENDATION', prompt: 'Lương tôi 12 triệu, tiền thuê 3 triệu. Nên chia ngân sách thế nào?' },
  { id: '3', label: 'Mua laptop 25tr / 8 tháng', category: 'RECOMMENDATION', prompt: 'Tôi muốn mua laptop 25 triệu sau 8 tháng' },
  { id: '4', label: 'Tạo ngân sách', category: 'RAG', prompt: 'Cách tạo ngân sách' },
  { id: '5', label: 'Nạp & Rút tiền', category: 'RAG', prompt: 'Nạp rút tiền thế nào?' },
  { id: '6', label: 'Tạo danh mục', category: 'RAG', prompt: 'Cách tạo danh mục' },
  { id: '7', label: 'Tạo ví mới', category: 'RAG', prompt: 'Làm sao tạo ví?' },
  { id: '8', label: 'Quên mã PIN', category: 'RAG', prompt: 'Quên PIN phải làm sao?' },
  { id: '9', label: 'Khoản nào cắt giảm?', category: 'ANALYTICS', prompt: 'Khoản nào có thể cắt giảm?' },
];

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyBEVNPlgMS8gro2LmgHB_SzsgRi4q1752I";

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
}

class AIChatService {

  async processMessage(userPrompt: string): Promise<ChatMessage> {
    let raw = userPrompt.trim();
    let norm = normalizeText(raw);

    // Map numeric shortcut inputs (1, 2, 3) to full queries
    if (norm === '1') {
      raw = "Hướng dẫn sử dụng ứng dụng (Ngân sách, Nạp/Rút tiền, Danh mục, Tạo ví, Quên PIN)";
      norm = normalizeText(raw);
    } else if (norm === '2') {
      raw = "Phân tích chi tiết thu chi cá nhân hiện tại";
      norm = normalizeText(raw);
    } else if (norm === '3') {
      raw = "Tư vấn lập ngân sách & lộ trình tiết kiệm mục tiêu";
      norm = normalizeText(raw);
    }

    // Try Spring Boot Backend AI Endpoint first
    try {
      const response: any = await axiosClient.post(ENDPOINTS.AI.CHAT, {
        message: raw
      });

      const resData = response.data || response;
      if (resData && (resData.text || resData.data?.text)) {
        const item = resData.data || resData;
        return {
          id: item.id || Date.now().toString(),
          text: item.text,
          isUser: false,
          timestamp: item.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleType: item.moduleType || 'RAG',
          cards: item.cards || undefined,
          actionPrompt: item.actionPrompt || this.buildActionPrompt(norm, raw)
        };
      }
    } catch (backendErr) {
      console.warn("Backend AI Endpoint offline, running FE fallback:", backendErr);
    }

    // Fallback: FE Direct Gemini 2.5 Flash + Local Advisory Engine
    return await this.fallbackDirectEngine(raw, norm);
  }

  private async fallbackDirectEngine(raw: string, norm: string): Promise<ChatMessage> {
    let moduleType: 'RAG' | 'ANALYTICS' | 'RECOMMENDATION' = 'RAG';
    if (norm.includes('tu van') || norm.includes('tai chinh') || norm.includes('luong') || norm.includes('laptop') || norm.includes('chia')) {
      moduleType = 'RECOMMENDATION';
    } else if (norm.includes('tieu') || norm.includes('bao cao') || norm.includes('phan tich') || norm.includes('cat giam')) {
      moduleType = 'ANALYTICS';
    }

    try {
      const aiText = await this.callGeminiDirect(raw);
      const cards = this.buildCards(moduleType, norm, raw);
      const actionPrompt = this.buildActionPrompt(norm, raw);

      return {
        id: Date.now().toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        moduleType,
        cards,
        actionPrompt
      };
    } catch (e) {
      return this.buildLocalResponse(raw, norm, moduleType);
    }
  }

  private async callGeminiDirect(userPrompt: string): Promise<string> {
    const systemPrompt = `
Bạn là Trợ lý AI SmartSpend - Trợ lý phân tích & tư vấn tài chính cá nhân chuyên nghiệp.

QUY TẮC BẮT BUỘC KHI PHẢN HỒI:
1. ĐÁNH SỐ THỨ TỰ RÕ RÀNG (1., 2., 3.): Mọi câu trả lời có quy trình các bước hoặc danh sách tư vấn BẮT BUỘC phải đánh số thứ tự 1., 2., 3. ở đầu dòng.
2. BẮT BUỘC HOÀN THÀNH ĐẦY ĐỦ CÂU: Viết trọn vẹn câu trả lời, tuyệt đối KHÔNG được ngắt dở dang nửa câu. Đi thẳng vào vấn đề chính.
3. CÂU HỎI TƯƠNG TÁC CUỐI CÙNG: Cuối mỗi câu trả lời, hãy đặt 1 câu hỏi tương tác thân thiện gợi ý hành động tiếp theo (VD: 'Bạn có muốn Nạp tiền vào ví ngay để AI bắt đầu phân tích không?').
4. NẾU NGƯỜI DÙNG YÊU CẦU TƯ VẤN TÀI CHÍNH HIỆN TẠI KHI CHƯA NẠP TIỀN HOẶC CHƯA CÓ GIAO DỊCH (SỐ DƯ 0Đ):
   - BẮT BUỘC thông báo rõ tài khoản hiện chưa có dữ liệu giao dịch hoặc số dư đang là 0đ.
   - YÊU CẦU NGƯỜI DÙNG NẠP TIỀN VÀO VÍ HOẶC TẠO GIAO DỊCH MỚI để AI có dữ liệu thu chi thực tế nhằm tư vấn chính xác.
   - KHÔNG tự ý đưa vào Mô hình phân bổ 50/30/20 nếu người dùng không hỏi về phân bổ lương/ngân sách.
5. NẾU NGƯỜI DÙNG HỎI PHÂN BỔ LƯƠNG/NGÂN SÁCH (VD: Lương 12tr, thuê 3tr):
   - Đưa ra con số cụ thể: Cố định/Thuê 25% = 3tr; Ăn uống 29% = 3.5tr; Tiết kiệm 21% = 2.5tr; Giải trí 13% = 1.5tr; Dự phòng 12% = 1.5tr.
6. NẾU NGƯỜI DÙNG HỎI MỤC TIÊU TIẾT KIỆM (VD: Mua laptop 25tr sau 8 tháng):
   - BẮT BUỘC tính số tiền cụ thể: 25.000.000 / 8 = 3.125.000 VNĐ/tháng và 3 bước thực hiện.
7. TRI THỨC SMARTSPEND:
   - Tạo ngân sách: 1. Vào Ngân sách -> "+ Tạo ngân sách". 2. Chọn danh mục, hạn mức và chu kỳ. 3. Nhấn Lưu (cảnh báo 80% & 100%).
   - Nạp/Rút: 1. Nạp tiền: Ví cá nhân -> Nạp tiền -> Quét QR SePay/Chuyển khoản -> Nhập PIN. 2. Rút tiền: Ví cá nhân -> Rút tiền -> Nhập số tiền -> Nhập PIN. 3. Ví nhóm: Nạp/Rút quỹ.
   - Tạo danh mục: 1. Cài đặt -> Quản lý danh mục -> 2. "+ Tạo danh mục mới" -> 3. Nhập tên, icon, màu -> Nhấn Lưu.
   - Tạo ví: 1. Trang chủ -> "+ Ví mới" -> 2. Nhập tên ví, loại ví, số dư -> 3. Nhấn Lưu ví.
   - Quên PIN: 1. Tại màn hình nhập PIN nhấn Quên mã PIN? -> 2. Nhập OTP gửi về Email -> 3. Tạo PIN 6 số mới.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nCâu hỏi người dùng: "${userPrompt}"` }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1200 }
      })
    });

    if (!response.ok) throw new Error('Gemini API HTTP ' + response.status);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty Gemini output');
    return text.trim();
  }

  private buildCards(moduleType: string, norm: string, rawPrompt: string) {
    if (norm.includes('laptop') || norm.includes('muc tieu') || norm.includes('mua')) {
      return [{
        type: 'GOAL_PLAN' as const,
        title: 'Kế hoạch tiết kiệm tích lũy mục tiêu',
        items: [
          { label: 'Mục tiêu tài chính', value: '25.0 triệu đ', color: '#2563EB' },
          { label: 'Thời gian hoàn thành', value: '8 tháng', color: '#4B5563' },
          { label: 'Cần tiết kiệm/tháng', value: '3.125.000 đ', color: '#10B981' }
        ]
      }];
    }

    if (norm.includes('luong') || norm.includes('thue') || norm.includes('chia') || norm.includes('phan bo')) {
      return [{
        type: 'BUDGET_SPLIT' as const,
        title: 'Tỷ lệ phân bổ ngân sách khuyến nghị',
        items: [
          { label: 'Tiền thuê & Cố định (25%)', value: '3.000.000 đ', color: '#EF4444' },
          { label: 'Ăn uống & Sinh hoạt (29%)', value: '3.500.000 đ', color: '#F59E0B' },
          { label: 'Tiết kiệm & Đầu tư (21%)', value: '2.500.000 đ', color: '#10B981' },
          { label: 'Giải trí & Khác (25%)', value: '3.000.000 đ', color: '#6366F1' }
        ]
      }];
    }

    // Do NOT return 50/30/20 card for general queries or empty account advisory unless specifically asking about budget/salary split
    return undefined;
  }

  private buildActionPrompt(norm: string, rawPrompt: string): ActionPrompt | undefined {
    if (norm.includes('tao vi') || norm.includes('xoa vi') || norm.includes('quan ly vi') || norm.includes('vi moi') || norm.includes('vi')) {
      return {
        question: "Bạn có muốn mở màn hình Quản lý ví để xem hoặc tạo ví mới không?",
        actions: [
          { label: "Quản lý & Tạo ví mới", route: "/wallet" }
        ]
      };
    }

    if (norm.includes('pin') || norm.includes('quen pin')) {
      return {
        question: "Bạn có muốn truy cập màn hình Cài đặt ngay không?",
        actions: [
          { label: "Vào Cài đặt", route: "/settings" }
        ]
      };
    }

    if (norm.includes('cat giam') || norm.includes('khoan nao')) {
      return {
        question: "Bạn có muốn xem Báo cáo chi tiêu hoặc thiết lập Ngân sách cắt giảm ngay không?",
        actions: [
          { label: "Xem Báo cáo chi tiêu", route: "/report" },
          { label: "Tạo Ngân sách", route: "/budget/create" }
        ]
      };
    }

    if (norm.includes('laptop') || norm.includes('muc tieu') || norm.includes('mua')) {
      return {
        question: "Bạn có muốn tạo ngay Ngân sách tiết kiệm 3.125.000đ/tháng cho mục tiêu này không?",
        actions: [
          { label: "Tạo ngân sách ngay", route: "/budget/create" },
          { label: "Quản lý ngân sách", route: "/budget" }
        ]
      };
    }

    if (norm.includes('tu van') || norm.includes('tai chinh')) {
      return {
        question: "Tài khoản chưa có số dư & dữ liệu. Bạn có muốn Nạp tiền vào ví ngay không?",
        actions: [
          { label: "Nạp tiền ngay", route: "/transfer" },
          { label: "Quản lý Ví", route: "/wallet" }
        ]
      };
    }

    if (norm.includes('luong') || norm.includes('thue') || norm.includes('chia') || norm.includes('ngan sach')) {
      return {
        question: "Bạn có muốn mở màn hình Tạo ngân sách chi tiêu ngay bây giờ không?",
        actions: [
          { label: "Tạo ngân sách ngay", route: "/budget/create" },
          { label: "Quản lý danh mục", route: "/categories" }
        ]
      };
    }

    if (norm.includes('nap') || norm.includes('rut')) {
      return {
        question: "Bạn có muốn chuyển sang màn hình Nạp/Rút tiền ngay bây giờ không?",
        actions: [
          { label: "Tới màn hình Nạp/Rút", route: "/transfer" },
          { label: "Quản lý Ví cá nhân", route: "/wallet" }
        ]
      };
    }

    if (norm.includes('danh muc')) {
      return {
        question: "Bạn có muốn mở màn hình Quản lý danh mục ngay không?",
        actions: [
          { label: "Mở Quản lý danh mục", route: "/categories" }
        ]
      };
    }

    if (norm.includes('tieu nhieu') || norm.includes('tieu o dau') || norm.includes('bao cao') || norm.includes('phan tich')) {
      return {
        question: "Bạn có muốn mở màn hình Báo cáo phân tích chi tiêu ngay không?",
        actions: [
          { label: "Xem Báo cáo chi tiêu", route: "/report" }
        ]
      };
    }

    // Do NOT attach action prompt box for general queries or number choices (1, 2, 3)
    return undefined;
  }

  private buildLocalResponse(raw: string, norm: string, moduleType: 'RAG' | 'ANALYTICS' | 'RECOMMENDATION'): ChatMessage {
    let text = '';
    if (norm.includes('tao vi') || norm.includes('xoa vi') || norm.includes('quan ly vi') || norm.includes('vi moi') || norm.includes('vi')) {
      text = `Hướng dẫn tạo và quản lý ví trong SmartSpend:\n\n1. Tại Trang chủ hoặc mục Ví cá nhân, nhấn vào nút '+ Ví mới' (hoặc chọn Thêm ví).\n2. Nhập Tên ví (ví dụ: Ví tiền mặt, Ví MoMo, Ví Techcombank), chọn Loại ví và nhập Số dư ban đầu.\n3. Nhấn 'Lưu ví' để hoàn tất. Bạn có thể chọn ví này làm Ví mặc định để thực hiện các giao dịch.`;
    } else if (norm.includes('pin') || norm.includes('quen pin') || norm.includes('ma pin') || norm.includes('doi pin')) {
      text = `Hướng dẫn xử lý khi quên mã PIN bảo mật:\n\n1. Tại màn hình nhập PIN khi Nạp/Rút tiền hoặc trong Cài đặt, nhấn chọn 'Quên mã PIN?'.\n2. Kiểm tra Email đăng ký tài khoản SmartSpend để nhận mã xác minh OTP gửi về.\n3. Nhập mã OTP chính xác, sau đó tiến hành tạo Mã PIN 6 số mới và xác nhận lại để hoàn tất.`;
    } else if (norm.includes('cat giam') || norm.includes('khoan nao') || norm.includes('giam chi tieu')) {
      text = `Gợi ý các khoản chi tiêu có thể cắt giảm hiệu quả:\n\n1. Rà soát danh mục Giải trí & Mua sắm ngẫu hứng: Cắt giảm 15-20% các chi phí xem phim, cà phê, mua sắm không có trong kế hoạch.\n2. Hạn chế Ăn uống bên ngoài: Tăng cường tự nấu ăn tại nhà để tiết kiệm từ 1 - 2 triệu đồng mỗi tháng.\n3. Thiết lập Ngân sách hạn mức: Vào mục Ngân sách để cài đặt hạn mức chi tiêu tối đa cho từng danh mục, AI sẽ tự động cảnh báo khi bạn tiêu gần chạm ngưỡng.`;
    } else if (norm.includes('laptop') || norm.includes('muc tieu') || norm.includes('mua')) {
      text = `Lộ trình tiết kiệm mua sắm mục tiêu:\n\n1. Để đạt mục tiêu 25 triệu sau 8 tháng, bạn cần trích cố định 3.125.000đ mỗi tháng.\n2. Hãy mở một Ví tích lũy riêng và cài đặt tính năng tự động trích tiền khi nhận lương.\n3. Duy trì mức chi tiêu cố định và hạn chế mua sắm không phát sinh kế hoạch.`;
    } else if (norm.includes('luong') || norm.includes('thue') || norm.includes('chia') || norm.includes('phan bo')) {
      text = `Phương án phân bổ ngân sách tối ưu (Lương 12tr, Tiền thuê 3tr):\n\n1. Tiền thuê & Cố định (25%): 3.000.000đ.\n2. Ăn uống & Sinh hoạt (29%): 3.500.000đ.\n3. Tiết kiệm & Đầu tư (21%): 2.500.000đ.\n4. Giải trí & Mua sắm (25%): 3.000.000đ.`;
    } else if (norm.includes('tu van') || norm.includes('tai chinh') || norm.includes('cho toi')) {
      text = `Tài khoản của bạn hiện chưa có dữ liệu giao dịch hoặc số dư đang là 0đ.\n\n1. Vui lòng Nạp tiền vào ví hoặc Ghi chép giao dịch mới để SmartSpend có dữ liệu phân tích thu chi cá nhân cho bạn.\n2. Ngay khi có số dư và giao dịch đầu tiên, AI sẽ tự động phân tích và đưa ra tư vấn cá nhân hóa chi tiết.\n3. Hãy thực hiện Nạp tiền vào Ví chính ngay để bắt đầu trải nghiệm tư vấn tài chính thông minh!`;
    } else if (norm.includes('ngan sach')) {
      text = `Hướng dẫn tạo ngân sách trong SmartSpend:\n\n1. Vào mục "Ngân sách" -> "+ Tạo ngân sách".\n2. Chọn danh mục, hạn mức và chu kỳ (tuần/tháng).\n3. Nhấn "Lưu". Hệ thống tự cảnh báo khi chi tiêu tới 80% & 100%.`;
    } else if (norm.includes('nap') || norm.includes('rut')) {
      text = `Hướng dẫn nạp và rút tiền:\n\n1. Nạp tiền: Vào Ví cá nhân -> Nạp tiền -> Quét QR SePay/Chuyển khoản -> Nhập PIN.\n2. Rút tiền: Vào Ví cá nhân -> Rút tiền -> Nhập số tiền -> Nhập PIN.\n3. Ví nhóm: Mở Ví nhóm -> Nạp/Rút quỹ.`;
    } else if (norm.includes('danh muc')) {
      text = `Hướng dẫn tạo danh mục thu chi:\n\n1. Vào Cài đặt -> Quản lý danh mục.\n2. Chọn tab Chi tiêu hoặc Thu nhập -> "+ Tạo danh mục mới".\n3. Nhập tên, icon & màu đại diện -> Nhấn "Lưu".`;
    } else if (norm.includes('tieu nhieu') || norm.includes('tieu o dau') || norm.includes('bao cao') || norm.includes('phan tich')) {
      text = `Hướng dẫn xem phân tích & báo cáo chi tiêu:\n\n1. Vào mục "Báo cáo" từ thanh điều hướng bên dưới.\n2. Xem biểu đồ tròn phân bổ chi tiêu theo danh mục để biết bạn đang tiêu nhiều tiền nhất ở đâu.\n3. So sánh biến động thu chi hàng tuần/hàng tháng để điều chỉnh thói quen tài chính kịp thời.`;
    } else {
      text = `Tư vấn tài chính & Hướng dẫn sử dụng SmartSpend:\n\n1. Áp dụng mô hình 50/30/20 để quản lý tài chính hiệu quả.\n2. Thiết lập ngân sách và theo dõi báo cáo chi tiêu hàng tuần.\n3. Bạn có thể hỏi: "tạo ví", "quên PIN", "cắt giảm chi tiêu", "nạp rút", "ngân sách", "lương 12tr", "mua laptop 25tr" hoặc "tư vấn tài chính hiện tại cho tôi".`;
    }

    return {
      id: Date.now().toString(),
      text,
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      moduleType,
      cards: this.buildCards(moduleType, norm, raw),
      actionPrompt: this.buildActionPrompt(norm, raw)
    };
  }
}

export const aiChatService = new AIChatService();
