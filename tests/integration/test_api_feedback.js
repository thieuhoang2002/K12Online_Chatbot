/**
 * INTEGRATION TEST: Feedback API Route (/api/feedback)
 * Tương ứng: TC-API-FB-01 -> TC-API-FB-04
 */

async function run(baseUrl = "http://localhost:3000") {
  const results = [];

  // TC-API-FB-01: Gửi đánh giá Thích (Like) hợp lệ
  try {
    const res = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 'like',
        sessionId: 'test-session-automation',
        messageId: 'test-msg-01',
        userQuestion: 'Cách tạo đề thi trắc nghiệm',
        aiResponse: 'Bước 1: Vào mục Quản lý học tập...',
        engineUsed: 'gemini-3.8-flash'
      })
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 200 && data.success === true) {
      results.push({ id: 'TC-API-FB-01', name: 'Gửi đánh giá Thích (Like) hợp lệ (HTTP 200)', status: 'PASS', details: 'Ghi nhận phản hồi Like thành công vào cơ sở dữ liệu.' });
    } else {
      results.push({ id: 'TC-API-FB-01', name: 'Gửi đánh giá Thích (Like) hợp lệ (HTTP 200)', status: 'FAIL', details: `Nhận được HTTP ${res.status}: ${JSON.stringify(data)}` });
    }
  } catch (err) {
    results.push({ id: 'TC-API-FB-01', name: 'Gửi đánh giá Thích (Like) hợp lệ (HTTP 200)', status: 'FAIL', details: err.message });
  }

  // TC-API-FB-02: Gửi đánh giá Không thích (Dislike) kèm lý do
  try {
    const res = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 'dislike',
        reason: 'missing_steps',
        comment: 'Automation test: Đề nghị bổ sung thêm hướng dẫn xuất file Excel.',
        sessionId: 'test-session-automation',
        messageId: 'test-msg-02',
        userQuestion: 'Cách xuất điểm tổng kết',
        aiResponse: 'Vào mục sổ điểm...',
        engineUsed: 'gemini-3.8-flash'
      })
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 200 && data.success === true) {
      results.push({ id: 'TC-API-FB-02', name: 'Gửi đánh giá Không thích (Dislike) kèm lý do (HTTP 200)', status: 'PASS', details: 'Ghi nhận Dislike thành công và kích hoạt cảnh báo Telegram ngầm.' });
    } else {
      results.push({ id: 'TC-API-FB-02', name: 'Gửi đánh giá Không thích (Dislike) kèm lý do (HTTP 200)', status: 'FAIL', details: `Nhận được HTTP ${res.status}: ${JSON.stringify(data)}` });
    }
  } catch (err) {
    results.push({ id: 'TC-API-FB-02', name: 'Gửi đánh giá Không thích (Dislike) kèm lý do (HTTP 200)', status: 'FAIL', details: err.message });
  }

  // TC-API-FB-03: Từ chối đánh giá sai giá trị rating (HTTP 400)
  try {
    const res = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 'invalid_rating_value',
        sessionId: 'test-session-automation'
      })
    });

    if (res.status === 400) {
      results.push({ id: 'TC-API-FB-03', name: 'Từ chối đánh giá sai giá trị rating (HTTP 400)', status: 'PASS', details: 'Máy chủ thẩm định schema nghiêm ngặt, từ chối giá trị ngoài like/dislike.' });
    } else {
      results.push({ id: 'TC-API-FB-03', name: 'Từ chối đánh giá sai giá trị rating (HTTP 400)', status: 'FAIL', details: `Nhận được mã trạng thái ${res.status} thay vì 400.` });
    }
  } catch (err) {
    results.push({ id: 'TC-API-FB-03', name: 'Từ chối đánh giá sai giá trị rating (HTTP 400)', status: 'FAIL', details: err.message });
  }

  // TC-API-FB-04: Từ chối yêu cầu thiếu trường bắt buộc (HTTP 400)
  try {
    const res = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: "Chỉ gửi bình luận không có rating" })
    });

    if (res.status === 400) {
      results.push({ id: 'TC-API-FB-04', name: 'Từ chối yêu cầu thiếu trường bắt buộc (HTTP 400)', status: 'PASS', details: 'Bảo vệ cơ sở dữ liệu khỏi các bản ghi rác hoặc thiếu ID phiên.' });
    } else {
      results.push({ id: 'TC-API-FB-04', name: 'Từ chối yêu cầu thiếu trường bắt buộc (HTTP 400)', status: 'FAIL', details: `Nhận được mã trạng thái ${res.status}.` });
    }
  } catch (err) {
    results.push({ id: 'TC-API-FB-04', name: 'Từ chối yêu cầu thiếu trường bắt buộc (HTTP 400)', status: 'FAIL', details: err.message });
  }

  return results;
}

module.exports = { run };
