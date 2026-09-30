/**
 * Từ điển đồng nghĩa Tiếng Việt trong ngành Giáo dục & Hệ thống K12Online
 * Tự động ánh xạ các cách nói dân dã, thuật ngữ địa phương hoặc chữ viết tắt của Thầy/Cô
 * sang từ khóa chuẩn hóa của hệ thống K12Online.
 */

export interface SynonymGroup {
  canonical: string[]; // Các từ khóa chuẩn có trong bài viết
  aliases: string[];   // Các từ đồng nghĩa, từ lóng, viết tắt
}

export const SYNONYM_GROUPS: SynonymGroup[] = [
  // 1. Thời khóa biểu / Lịch dạy
  {
    canonical: ["thời khóa biểu", "phân công", "lịch dạy", "tiết dạy"],
    aliases: [
      "lập lịch dạy", "xếp lịch dạy", "lịch dạy", "phân công lịch",
      "lịch học", "lịch tuần", "tiết dạy", "tkb", "xep tkb", "lap tkb",
      "phan cong chuyen mon", "lich bao giang"
    ],
  },
  // 2. Bài thi / Đề thi / Kiểm tra
  {
    canonical: ["bài thi", "đề thi", "bài kiểm tra", "làm bài", "nộp bài", "ngân hàng câu hỏi", "câu hỏi", "trắc nghiệm"],
    aliases: [
      "kiểm tra 15p", "kiểm tra 15 phút", "kiểm tra 1 tiết", "kiem tra",
      "bài kiểm tra", "thi học kỳ", "thi giữa kỳ", "thi thử", "khảo sát",
      "nộp bài kiểm tra", "làm bài kiểm tra", "nộp bài thi", "làm bài thi",
      "nop bai kiem tra", "lam bai kiem tra", "nop bai thi", "lam bai thi",
      "ma trận đề", "ngân hàng đề", "bo de"
    ],
  },
  // 3. Nhập đề & Trộn đề từ Word
  {
    canonical: ["file word", "trắc nghiệm", "hoán vị", "trộn đề", "nhập câu hỏi"],
    aliases: [
      "nhập từ word", "file word dạng abcd", "dạng abcd", "đảo đề",
      "trộn đề", "hoán vị câu hỏi", "tải đề lên", "import word", "dua de vao"
    ],
  },
  // 4. K12Connect & Bài tập về nhà
  {
    canonical: ["k12connect", "bài tập về nhà", "nộp bài", "giao bài"],
    aliases: [
      "k12 connect", "nop bai tap", "giao bai tap", "bai tap ve nha",
      "bài tập", "phụ huynh nộp bài", "học sinh nộp bài", "app k12connect"
    ],
  },
  // 5. Điểm danh & Chuyên cần
  {
    canonical: ["điểm danh", "chuyên cần", "thông báo vi phạm", "nghỉ học"],
    aliases: [
      "vắng học", "nghi hoc", "diem danh", "chuyen can", "báo vắng",
      "nghỉ phép", "xin nghỉ", "vang co phep", "vang khong phep", "so diem danh"
    ],
  },
  // 6. Sổ điểm & Chấm bài
  {
    canonical: ["sổ điểm", "chấm bài", "kết quả", "đánh giá"],
    aliases: [
      "cham bai", "cham diem", "vào điểm", "nhập điểm", "so diem",
      "bang diem", "kết quả học tập", "nhap diem so", "xuat diem"
    ],
  },
  // 7. Mật khẩu & Tài khoản
  {
    canonical: ["đổi mật khẩu", "tài khoản", "đăng nhập", "khôi phục"],
    aliases: [
      "quên mật khẩu", "quen mat khau", "mất mật khẩu", "doi mat khau",
      "reset pass", "lấy lại mật khẩu", "khoi phuc tai khoan", "khong dang nhap duoc"
    ],
  },
  // 8. Bảng tin & Đăng bài
  {
    canonical: ["bảng tin", "bài viết", "chỉnh sửa bài viết", "đăng bài"],
    aliases: [
      "đăng tin", "dang bai", "bang tin", "thông báo", "đăng video",
      "bình chọn", "sửa bài đăng", "xoa bai dang"
    ],
  },
  // 9. Giám thị & Quản lý coi thi
  {
    canonical: ["phân công giám thị", "quản lý vi phạm", "giám thị"],
    aliases: [
      "coi thi", "giam thi", "phan cong coi thi", "bắt gian lận",
      "học sinh vi phạm", "ghi nhận vi phạm"
    ],
  },
  // 10. Lớp học ảo / Học trực tuyến
  {
    canonical: ["lớp học ảo", "trực tuyến", "phòng học"],
    aliases: [
      "phòng học zoom", "phòng học teams", "học online", "học trực tuyến",
      "tiết học trực tuyến", "lop hoc ao", "day online"
    ],
  },
];

/**
 * Mở rộng từ khóa câu hỏi bằng từ điển đồng nghĩa
 */
export function expandKeywordsWithSynonyms(query: string): string[] {
  const normalized = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

  const extraKeywords = new Set<string>();

  for (const group of SYNONYM_GROUPS) {
    let matched = false;

    // Kiểm tra xem câu hỏi có chứa bất kỳ alias nào không
    for (const alias of group.aliases) {
      const normAlias = alias
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");

      if (normalized.includes(normAlias)) {
        matched = true;
        break;
      }
    }

    // Nếu khớp, bổ sung các từ khóa chuẩn vào danh sách mở rộng
    if (matched) {
      for (const canon of group.canonical) {
        extraKeywords.add(canon);
      }
    }
  }

  return Array.from(extraKeywords);
}
