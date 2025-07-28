import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PAGE_SIZE = 10;

export async function POST(req: Request) {
  const {
    keyword,
    page = 1,
    includeMain = true,
    includeToddler = true,
  } = await req.json();

  const offset = (page - 1) * PAGE_SIZE;

  const client = await pool.connect();

  try {
    // toddler 필터 조건 구성
    let toddlerCondition = "";
    if (includeMain && !includeToddler) {
      toddlerCondition = "AND yv.toddler = false";
    } else if (!includeMain && includeToddler) {
      toddlerCondition = "AND yv.toddler = true";
    } else if (!includeMain && !includeToddler) {
      return NextResponse.json({ results: [], totalCount: 0 }, { status: 400 });
    }

    // 총 개수 쿼리
    const countQuery = `
      SELECT COUNT(*)
      FROM youtube_transcripts yt
      JOIN youtube_videos yv ON yt.video_id = yv.video_id
      WHERE yt.text ~* $1
      ${toddlerCondition}
    `;
    const countResult = await client.query(countQuery, [`\\m${keyword}\\M`]);
    const totalCount = parseInt(countResult.rows[0].count || "0", 10);

    // 실제 데이터 쿼리
    const dataQuery = `
      SELECT yt.video_id, yt.start, yt.dur, yt.text, yv.title, yv.published_at
      FROM youtube_transcripts yt
      JOIN youtube_videos yv ON yt.video_id = yv.video_id
      WHERE yt.text ~* $1
      ${toddlerCondition}
      ORDER BY yv.published_at DESC, yt.start
      LIMIT $2 OFFSET $3;
    `;
    const dataValues = [`\\m${keyword}\\M`, PAGE_SIZE, offset];
    const result = await client.query(dataQuery, dataValues);

    const grouped: Record<
      string,
      {
        video_id: string;
        title: string;
        published_at: string;
        items: { start: number; dur: number; text: string }[];
      }
    > = {};

    for (const row of result.rows) {
      const { video_id, title, published_at, start, dur, text } = row;

      if (!grouped[video_id]) {
        grouped[video_id] = {
          video_id,
          title,
          published_at,
          items: [],
        };
      }

      grouped[video_id].items.push({ start, dur, text });
    }

    return NextResponse.json({
      results: Object.values(grouped),
      totalCount,
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.error();
  } finally {
    client.release();
  }
}
