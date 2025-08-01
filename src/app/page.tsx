"use client";

import Image from "next/image";
import { JSX, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import Link from "next/link";
import he from "he";

const PAGE_SIZE = 10;

type TranscriptItem = {
  start: number;
  dur: number;
  text: string;
};

type VideoGroup = {
  video_id: string;
  title: string;
  items: TranscriptItem[];
  published_at: string;
};

// function BmcButton() {
//   return (
//     <a
//       href="https://www.buymeacoffee.com/yourusername"
//       target="_blank"
//       rel="noopener noreferrer"
//       className="flex items-center gap-2 bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 rounded shadow font-medium transition"
//     >
//       <span className="text-xl">☕</span>
//       <span>Buy me a coffee</span>
//     </a>
//   );
// }

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}

function YouTubePlayer({ videoId, start }: { videoId: string; start: number }) {
  return (
    <iframe
      className="w-full h-full"
      src={`https://www.youtube.com/embed/${videoId}?start=${Math.floor(
        start
      )}`}
      title="YouTube video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState("");
  const [committedKeyword, setCommittedKeyword] = useState("");
  const [includeMain, setIncludeMain] = useState(true);
  const [includeToddler, setIncludeToddler] = useState(true);

  const [results, setResults] = useState<VideoGroup[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const queryKeyword = searchParams.get("keyword") || "";
    const queryPage = parseInt(searchParams.get("page") || "1", 10);
    const mainChecked = searchParams.get("main") !== "0";
    const toddlerChecked = searchParams.get("toddler") !== "0";

    setIncludeMain(mainChecked);
    setIncludeToddler(toddlerChecked);

    if (queryKeyword.trim().length >= 3) {
      setKeyword(queryKeyword);
      setCommittedKeyword(queryKeyword);
      setPage(queryPage);
      handleSearch(queryKeyword, queryPage, mainChecked, toddlerChecked);
    }
  }, [searchParams]);

  const handleSearch = async (
    searchWord: string,
    pageNum: number,
    main: boolean,
    toddler: boolean
  ) => {
    if (searchWord.length < 3) {
      alert("검색어는 최소 3글자 이상 입력해주세요.");
      return;
    }
    if (!main && !toddler) {
      alert("본채널 또는 토들러채널 중 하나 이상 선택해주세요.");
      return;
    }

    setIsLoading(true);
    setResults([]);
    setTotalCount(0);
    setHasSearched(true);

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: searchWord,
        page: pageNum,
        includeMain: main,
        includeToddler: toddler,
      }),
    });

    setIsLoading(false);

    if (!res.ok) {
      console.error("Failed to fetch");
      return;
    }

    const { results: data, totalCount } = await res.json();
    setResults(data);
    setTotalCount(totalCount);
  };

  const onPageClick = (newPage: number) => {
    const encodedKeyword = encodeURIComponent(committedKeyword);
    const query = `/?keyword=${encodedKeyword}&page=${newPage}&main=${
      includeMain ? 1 : 0
    }&toddler=${includeToddler ? 1 : 0}`;
    router.push(query);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hrs > 0
      ? `${hrs}:${mins.toString().padStart(2, "0")}:${secs
          .toString()
          .padStart(2, "0")}`
      : `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const highlightKeyword = (text: string): JSX.Element => {
    if (committedKeyword.trim().length < 3) return <>{text}</>;
    const escaped = committedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const highlighted = text.replace(regex, `<b class="text-red-600">$1</b>`);
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!includeMain && !includeToddler) {
        alert("본채널 또는 토들러채널 중 하나 이상 선택해주세요.");
        return;
      }
      setCommittedKeyword(keyword);
      const query = `/?keyword=${encodeURIComponent(keyword)}&page=1&main=${
        includeMain ? 1 : 0
      }&toddler=${includeToddler ? 1 : 0}`;
      router.push(query);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-2xl mx-auto bg-white text-black flex flex-col">
        <div className="mb-2">
          <Link
            href="/"
            onClick={() => {
              setResults([]);
              setHasSearched(false);
              setKeyword("");
              setCommittedKeyword("");
              setTotalCount(0);
            }}
            className="inline-flex items-center gap-2"
          >
            <Image src="/la-logo.png" width={40} height={40} alt="logo" />
            <span className="text-3xl font-bold">Live Academy Finder</span>
          </Link>
        </div>

        {/* 체크박스 */}
        <div className="w-full flex items-center gap-4 mb-2 text-sm text-gray-700">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={includeMain}
              onChange={(e) => setIncludeMain(e.target.checked)}
            />
            본채널
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={includeToddler}
              onChange={(e) => setIncludeToddler(e.target.checked)}
            />
            토들러채널
          </label>
        </div>

        {/* 검색 입력 */}
        <div className="w-full flex">
          <input
            type="text"
            placeholder="ex) come up with, from now on"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-[0.5px] px-3 py-2 rounded-l"
          />
          <button
            onClick={() => {
              if (!includeMain && !includeToddler) {
                alert("본채널 또는 토들러채널 중 하나 이상 선택해주세요.");
                return;
              }
              setCommittedKeyword(keyword);
              const query = `/?keyword=${encodeURIComponent(
                keyword
              )}&page=1&main=${includeMain ? 1 : 0}&toddler=${
                includeToddler ? 1 : 0
              }`;
              router.push(query);
            }}
            className="bg-red-500 text-white font-semibold px-4 py-2 rounded-r hover:bg-red-600"
          >
            Search
          </button>
        </div>

        {/* 결과 출력 */}
        <div className="w-full  mt-3 space-y-4">
          {isLoading && (
            <div className="flex justify-center my-[20px]">
              <div className="spinner w-12 h-12" />
            </div>
          )}

          {!isLoading && hasSearched && results.length === 0 && (
            <div className="w-full flex justify-center my-[20px]">
              <p className="text-gray-500">No result</p>
            </div>
          )}

          {!isLoading && !hasSearched && results.length === 0 && (
            <div className="border-[0.5px] rounded p-3 bg-gray-50 mb-2 text-sm text-gray-600">
              <p className="mb-2 font-semibold whitespace-pre-line">
                {`“분명 빨모쌤한테 배운 표현인데.. 기억은 가물가물 🧐 그 영상을 다시 보고 싶은데 어떤 영상인지 기억이 안 나시나요?”
                “미드보다가 새로운 표현을 배웠는데, 빨모쌤은 그 표현을 어떤 식으로 사용하는지 궁금하신가요?”`}
              </p>
              <p className="mb-4 font-semibold whitespace-pre-line">
                {`그럴 땐 Live Academy Finder를 활용해보세요! 😆`}
              </p>
              <p className="mb-1">📝 사용 전 참고사항</p>
              <ul className="space-y-1 pl-4 list-disc">
                <li>
                  시제를 바꿔가며 검색해보세요. 예: <code>run out of</code> →{" "}
                  <code>running out of,</code> <code>come up with</code> →{" "}
                  <code>came up with</code>
                </li>
                <li>
                  유튜브 자막 기반 검색이라 자동자막이 부정확한 경우 검색에서
                  제외될 수 있습니다.
                </li>
                <li>최근 영상들은 검색에서 제외될 수 있습니다.</li>
                <li>
                  토들러 채널은 한국어를 많이 섞어 쓰시기 때문에 자막 인식률이
                  낮을 수 있습니다.
                </li>
                <li>
                  저렴한 서버라서 검색 속도가 느릴 수 있고, 한달에 50,000건 호출
                  제한이 있으니 양해바랍니다. (월말쯤 갱신)
                </li>
              </ul>
            </div>
          )}

          {results.map((video, videoIdx) => (
            <details
              key={video.video_id + "-" + videoIdx}
              className="border-[0.5px] rounded md:p-4 p-2 bg-gray-50"
              open={videoIdx === 0}
            >
              <summary className="font-semibold cursor-pointer">
                {formatDate(video.published_at)} - {he.decode(video.title)}
              </summary>
              <div className="pl-4 mt-2 space-y-2">
                {video.items.map((item, idx) => (
                  <details
                    key={idx}
                    className="bg-white border-[0.5px] rounded md:p-4 p-2"
                    open={idx === 0}
                  >
                    <summary className="cursor-pointer text-sm">
                      🕒 {formatTime(item.start)} -{" "}
                      {highlightKeyword(item.text)}
                    </summary>
                    <div className="aspect-video w-full mt-2">
                      <YouTubePlayer
                        videoId={video.video_id}
                        start={item.start}
                      />
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2 flex-wrap">
              {page > 1 && (
                <button
                  onClick={() => onPageClick(page - 1)}
                  className="px-1.5 py-0.5 cursor-pointer hover:bg-gray-100 rounded"
                >
                  <GrFormPrevious />
                </button>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (pageNum) =>
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - page) <= 2
                )
                .reduce<number[]>((acc, current, idx, arr) => {
                  if (idx > 0 && current - arr[idx - 1] > 1) acc.push(-1);
                  acc.push(current);
                  return acc;
                }, [])
                .map((pageNum, idx) =>
                  pageNum === -1 ? (
                    <span key={`ellipsis-${idx}`} className="p-1">
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => onPageClick(pageNum)}
                      className={`px-1.5 py-0.5 cursor-pointer hover:bg-gray-100 hover:font-bold rounded ${
                        page === pageNum ? "font-bold" : ""
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}

              {page < totalPages && (
                <button
                  onClick={() => onPageClick(page + 1)}
                  className="px-1.5 py-0.5 cursor-pointer hover:bg-gray-100 rounded"
                >
                  <GrFormNext />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* <Script
        data-name="BMC-Widget"
        data-cfasync="false"
        src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
        data-id="yourusername"
        data-description="Support me on Buy me a coffee!"
        data-message="감사합니다! 도움이 되셨다면 커피 한 잔 후원 부탁드려요 :)"
        data-color="#FFDD00"
        data-position="right"
        data-x_margin="18"
        data-y_margin="18"
        strategy="afterInteractive"
      />
      <div className="mt-8 text-center">
        <BmcButton />
      </div> */}
    </div>
  );
}
