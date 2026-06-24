"use client"

import { ORG_TREE, RESOURCE_LEVEL_LABELS, type ResourceLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * 市 → 区 → 校 级联授权选择器（SaaS 多租户：后台新增资源必须指定具体归属）
 * - 选「市级」：选到市即可
 * - 选「区级」：先选市，再级联选区
 * - 选「校级」：先选市，再选区，最后级联选校
 *
 * 对外用 level + ownerScope（具体名称）表达，保持与现有数据模型兼容。
 */
export function OrgScopePicker({
  level,
  onLevelChange,
  cityId,
  districtId,
  schoolId,
  onChange,
}: {
  level: ResourceLevel
  onLevelChange: (level: ResourceLevel) => void
  cityId: string
  districtId: string
  schoolId: string
  // 返回级联 id 与最终归属名称
  onChange: (next: { cityId: string; districtId: string; schoolId: string; ownerScope: string }) => void
}) {
  const city = ORG_TREE.find((c) => c.id === cityId)
  const district = city?.districts.find((d) => d.id === districtId)

  function pickCity(id: string) {
    const c = ORG_TREE.find((x) => x.id === id)
    onChange({
      cityId: id,
      districtId: "",
      schoolId: "",
      ownerScope: level === "city" ? (c?.name ?? "") : "",
    })
  }
  function pickDistrict(id: string) {
    const d = city?.districts.find((x) => x.id === id)
    onChange({
      cityId,
      districtId: id,
      schoolId: "",
      ownerScope: level === "district" ? (d?.name ?? "") : "",
    })
  }
  function pickSchool(id: string) {
    const s = district?.schools.find((x) => x.id === id)
    onChange({ cityId, districtId, schoolId: id, ownerScope: s?.name ?? "" })
  }

  return (
    <div className="space-y-3">
      {/* 级别选择 */}
      <div className="flex gap-2">
        {(Object.keys(RESOURCE_LEVEL_LABELS) as ResourceLevel[]).map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => {
              onLevelChange(lv)
              // 切换级别后重置低层级选择，并按需回填 ownerScope
              if (lv === "city")
                onChange({ cityId, districtId: "", schoolId: "", ownerScope: city?.name ?? "" })
              else onChange({ cityId, districtId: "", schoolId: "", ownerScope: "" })
            }}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition",
              level === lv
                ? "border-brand bg-brand-soft text-brand-soft-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {RESOURCE_LEVEL_LABELS[lv]}
          </button>
        ))}
      </div>

      {/* 级联下拉 */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">市</label>
          <Select
            value={cityId}
            onValueChange={pickCity}
            items={Object.fromEntries(ORG_TREE.map((c) => [c.id, c.name]))}
          >
            <SelectTrigger><SelectValue placeholder="选择市" /></SelectTrigger>
            <SelectContent>
              {ORG_TREE.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {level !== "city" && (
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">区</label>
            <Select
              value={districtId}
              onValueChange={pickDistrict}
              disabled={!city}
              items={Object.fromEntries((city?.districts ?? []).map((d) => [d.id, d.name]))}
            >
              <SelectTrigger><SelectValue placeholder="选择区" /></SelectTrigger>
              <SelectContent>
                {(city?.districts ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {level === "school" && (
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">校</label>
            <Select
              value={schoolId}
              onValueChange={pickSchool}
              disabled={!district}
              items={Object.fromEntries((district?.schools ?? []).map((s) => [s.id, s.name]))}
            >
              <SelectTrigger><SelectValue placeholder="选择学校" /></SelectTrigger>
              <SelectContent>
                {(district?.schools ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
