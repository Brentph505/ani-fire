"use client";

import { getSearchedAnimeByName } from "@/api/anime";
import HoveredContent from "@/components/shared/hovered-content";
import { Button } from "@/components/ui/button";
import { CustomImage } from "@/components/ui/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUERY_KEY } from "@/constants/query-key";
import { FILTERS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseAsString, useQueryState, useQueryStates } from "nuqs";
import { useCallback, useEffect, useState } from "react";

type FilterKey = keyof typeof FILTERS;

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [keyword] = useQueryState("keyword", {
    defaultValue: "",
    clearOnDefault: true,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEY.SEARCHED_ANIMES, keyword],
    queryFn: () => {
      if (!keyword) return;
      return getSearchedAnimeByName({ keyword, ...filter });
    },
  });

  const [currentFilters, setCurrentFilters] = useState<{
    [key: string]: string;
  }>({});

  const [{ ...filters }] = useQueryStates(
    {
      type: parseAsString.withDefault("all"),
      status: parseAsString.withDefault("all"),
      rated: parseAsString.withDefault("all"),
      score: parseAsString.withDefault("all"),
      season: parseAsString.withDefault("all"),
      language: parseAsString.withDefault("all"),
      sort: parseAsString.withDefault("default"),
    },
    {
      clearOnDefault: true,
    },
  );

  useEffect(() => {
    setCurrentFilters({ ...filters });
  }, []);

  // handle the change of select value
  const handleFilterChange = (filterKey: string, value: string) => {
    setCurrentFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  // filter out undefined filters
  const filter = Object.fromEntries(
    Object.entries(currentFilters).filter(
      ([_, v]) => v !== "all" && v !== "default" && v !== undefined,
    ),
  );

  const createQueryStrings = useCallback(
    (filters: { [key: string]: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (value === "all" || value === "default") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      return params.toString();
    },
    [searchParams],
  );

  const handleFilterClick = () => {
    window.location.assign(pathname + "?" + createQueryStrings(currentFilters));
  };

  if (isLoading) return <p>Searching Library for {keyword}</p>;

  return (
    <div className="wrapper-container px-4">
      <div className="my-8 w-full rounded-lg border border-muted bg-secondary/10 p-6">
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Filter</h2>

          <div className="flex w-full flex-wrap items-center gap-3">
            {Object.entries(FILTERS).map(([key, values]) => (
              <div key={key} className="flex items-center gap-3">
                <h3 className="text-sm capitalize">{key}:</h3>{" "}
                <Select
                  defaultValue={filters[key as FilterKey] ?? values[0]}
                  onValueChange={(value) => handleFilterChange(key, value)}
                >
                  <SelectTrigger className="min-w-[130px] text-sm capitalize">
                    <SelectValue className="" placeholder={values[0]} />
                  </SelectTrigger>
                  <SelectContent className="text-sm">
                    {values.map((value, idx) => (
                      <SelectItem
                        key={value}
                        value={value}
                        className="text-sm capitalize"
                      >
                        {key === "score" && value !== "all" && `(${idx})`}{" "}
                        {value.replace(/-/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <Button onClick={() => handleFilterClick()}>Filter</Button>
        </div>
      </div>
      <h1 className="my-8 text-2xl font-semibold text-primary">
        Search results for: {keyword}
      </h1>

      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {data?.animes.map(({ id, episodes, poster, type, duration, name }) => (
          <div key={id} className="flex flex-col gap-2 bg-black">
            <HoveredContent animeId={id}>
              <Link
                href={`/${id}`}
                className="relative aspect-[8/10] h-72 w-full overflow-hidden sm:aspect-[12/16]"
              >
                <CustomImage
                  src={poster}
                  alt={`${name} poster`}
                  fill
                  className="h-full w-full object-cover"
                />
              </Link>
            </HoveredContent>
            <Link
              href={`/${id}`}
              className="line-clamp-1 w-full text-ellipsis hover:text-primary"
            >
              {name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
