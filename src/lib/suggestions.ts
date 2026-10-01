export interface SuggestionSource {
  title: string;
  category?: string;
  url?: string;
  [key: string]: any;
}

/**
 * Tạo danh sách 2 - 3 câu hỏi gợi ý liên quan tiếp theo (Follow-up Prompts)
 * dựa trên chủ đề của câu hỏi và các tài liệu liên quan trong kho tri thức.
 */
export function generateFollowUpPrompts(query: string, docs: SuggestionSource[] = []): string[] {
  const clean = query.toLowerCase();
  const suggestions: string[] = [];

  // 1. Gợi ý theo chủ đề cụ thể
  if (clean.includes("word") || clean.includes("nhập đề") || clean.includes("abcd")) {
    suggestions.push("Cách cấu hình trộn đề thi hoán vị câu hỏi?");
    suggestions.push("Làm sao để cài đặt thang điểm cho từng câu?");
    suggestions.push("Học sinh làm bài thi trực tuyến cần lưu ý những gì?");
  } else if (clean.includes("bài thi") || clean.includes("đề thi") || clean.includes("kiểm tra")) {
    suggestions.push("Cách phân công giáo viên coi thi và giám thị?");
    suggestions.push("Xử lý thế nào khi học sinh bị mất mạng lúc đang làm bài?");
    suggestions.push("Cách xuất bảng điểm bài thi ra file Excel?");
  } else if (clean.includes("thời khóa biểu") || clean.includes("lịch dạy") || clean.includes("tkb")) {
    suggestions.push("Cách cấu hình phân công chuyên môn cho giáo viên?");
    suggestions.push("Làm sao để xuất thời khóa biểu toàn trường ra Excel?");
    suggestions.push("Xử lý khi có 2 giáo viên bị trùng tiết dạy như thế nào?");
  } else if (clean.includes("bài tập") || clean.includes("k12connect") || clean.includes("nộp bài")) {
    suggestions.push("Cách giáo viên chấm bài và trả lời nhận xét cho học sinh?");
    suggestions.push("Làm sao để giao bài tập cho riêng một nhóm học sinh?");
    suggestions.push("Phụ huynh theo dõi tiến độ nộp bài của con ở đâu?");
  } else if (clean.includes("điểm danh") || clean.includes("chuyên cần") || clean.includes("vắng")) {
    suggestions.push("Cách xuất báo cáo điểm danh cả tháng của lớp?");
    suggestions.push("Học sinh xin nghỉ phép trên app K12Connect như thế nào?");
    suggestions.push("Cách gửi thông báo vi phạm về cho phụ huynh?");
  } else if (clean.includes("mật khẩu") || clean.includes("đăng nhập") || clean.includes("tài khoản")) {
    suggestions.push("Cách cấp lại mật khẩu cho học sinh quên tài khoản?");
    suggestions.push("Làm sao để thay đổi số điện thoại liên kết tài khoản?");
    suggestions.push("Khắc phục lỗi không nhận được mã OTP khi đăng nhập?");
  } else if (clean.includes("bảng tin") || clean.includes("đăng bài") || clean.includes("bài viết")) {
    suggestions.push("Cách giới hạn quyền xem bài viết chỉ cho lớp mình?");
    suggestions.push("Làm sao để đính kèm file tài liệu và tạo bình chọn?");
    suggestions.push("Cách chỉnh sửa hoặc xóa bài viết đã đăng trên web?");
  } else if (clean.includes("thư viện") || clean.includes("sách") || clean.includes("mượn trả") || clean.includes("thủ thư")) {
    suggestions.push("Làm thế nào để biên mục sách và in mã vạch hàng loạt bằng file Excel?");
    suggestions.push("Quy trình lập phiếu kiểm kê thư viện định kỳ trên K12Online?");
    suggestions.push("Cách cấu hình số ngày mượn tối đa và xử lý sách quá hạn trả?");
  } else if (clean.includes("học phí") || clean.includes("đợt thu") || clean.includes("kế toán") || clean.includes("khoản thu")) {
    suggestions.push("Cách khai báo loại khoản thu và mức miễn giảm cho học sinh?");
    suggestions.push("Làm sao để xuất danh sách học sinh chưa đóng học phí ra Excel?");
    suggestions.push("Hướng dẫn phụ huynh thanh toán tiền học qua K12Connect");
  }

  // 2. Nếu chưa đủ 3 gợi ý, bổ sung từ tiêu đề các bài viết liên quan (docs)
  if (suggestions.length < 3 && docs && docs.length > 0) {
    for (const doc of docs) {
      if (suggestions.length >= 3) break;
      let promptTitle = doc.title.replace(/^Hướng dẫn\s+/i, "Cách ");
      if (!promptTitle.endsWith("?")) promptTitle += "?";
      if (!suggestions.includes(promptTitle) && !clean.includes(doc.title.toLowerCase().slice(0, 15))) {
        suggestions.push(promptTitle);
      }
    }
  }

  // 3. Fallback mặc định nếu vẫn thiếu
  const defaults = [
    "Học sinh làm bài thi trực tuyến cần lưu ý những gì?",
    "Hướng dẫn phụ huynh và học sinh nộp bài tập về nhà trên K12Connect",
    "Cách nhà trường cấu hình phân công giám thị và quản lý vi phạm",
  ];

  for (const def of defaults) {
    if (suggestions.length >= 3) break;
    if (!suggestions.includes(def)) suggestions.push(def);
  }

  return suggestions.slice(0, 3);
}
