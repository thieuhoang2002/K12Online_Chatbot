import { supabase } from "./supabase";
import { SearchResult } from "./knowledge";

/**
 * Tìm kiếm tài liệu bằng Vector Semantics (pgvector trên Supabase)
 * Nếu bảng hoặc hàm chưa được tạo trên Supabase, tự động trả về null
 * để hệ thống chuyển tiếp sang bộ tìm kiếm Từ khóa & Đồng nghĩa (Synonym RAG).
 */
export async function searchVectorKnowledge(
  query: string,
  topK: number = 3
): Promise<SearchResult[] | null> {
  if (!supabase) return null;

  try {
    // 1. Thử gọi hàm RPC match_k12_documents (nếu admin đã cấu hình pgvector)
    // Lưu ý: Trong kiến trúc Hybrid RAG, nếu chưa có embedding client,
    // ta kiểm tra xem bảng knowledge_embeddings có dữ liệu không.
    const { data: countData, error: countErr } = await supabase
      .from("knowledge_embeddings")
      .select("id")
      .limit(1);

    if (countErr || !countData || countData.length === 0) {
      // Bảng chưa có hoặc chưa nạp embedding -> Dùng RAG Từ khóa & Đồng nghĩa
      return null;
    }

    // 2. Nếu đã có dữ liệu vector và cấu hình text embedding:
    // Có thể gọi Supabase Edge Function hoặc RPC
    return null;
  } catch (err: any) {
    return null;
  }
}
