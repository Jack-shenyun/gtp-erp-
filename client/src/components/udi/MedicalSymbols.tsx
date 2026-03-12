/**
 * ISO 15223-1 医疗器械标准符号 SVG 组件
 * 用于 UDI 标签编辑器中的符号元素
 */
import React from "react";

interface SymbolProps {
  size?: number;
  color?: string;
  className?: string;
}

// 制造商符号 (工厂)
export const ManufacturerSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="10" width="20" height="12" stroke={color} strokeWidth="1.5" fill="none" />
    <polygon points="2,10 12,3 22,10" stroke={color} strokeWidth="1.5" fill="none" />
    <rect x="9" y="15" width="6" height="7" stroke={color} strokeWidth="1" fill="none" />
  </svg>
);

// 生产日期符号 (日历+工厂)
export const MfgDateSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="1" y="4" width="14" height="13" rx="1" stroke={color} strokeWidth="1.3" fill="none" />
    <line x1="1" y1="8" x2="15" y2="8" stroke={color} strokeWidth="1.3" />
    <line x1="5" y1="2" x2="5" y2="6" stroke={color} strokeWidth="1.3" />
    <line x1="11" y1="2" x2="11" y2="6" stroke={color} strokeWidth="1.3" />
    <polygon points="16,14 21,10 21,20 16,20" stroke={color} strokeWidth="1.2" fill="none" />
    <line x1="21" y1="10" x2="21" y2="20" stroke={color} strokeWidth="1.2" />
  </svg>
);

// 有效期符号 (沙漏)
export const ExpiryDateSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="1" y="4" width="14" height="13" rx="1" stroke={color} strokeWidth="1.3" fill="none" />
    <line x1="1" y1="8" x2="15" y2="8" stroke={color} strokeWidth="1.3" />
    <line x1="5" y1="2" x2="5" y2="6" stroke={color} strokeWidth="1.3" />
    <line x1="11" y1="2" x2="11" y2="6" stroke={color} strokeWidth="1.3" />
    <path d="M17 11 L23 11 L20 15 L23 19 L17 19 L20 15 Z" stroke={color} strokeWidth="1.2" fill="none" />
  </svg>
);

// 批号符号 LOT
export const LotSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 32 20" fill="none">
    <rect x="0.5" y="0.5" width="31" height="19" rx="2" stroke={color} strokeWidth="1" fill="none" />
    <text x="16" y="14" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="Arial" fill={color}>LOT</text>
  </svg>
);

// REF 参考号符号
export const RefSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 32 20" fill="none">
    <rect x="0.5" y="0.5" width="31" height="19" rx="2" stroke={color} strokeWidth="1" fill="none" />
    <text x="16" y="14" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="Arial" fill={color}>REF</text>
  </svg>
);

// SN 序列号符号
export const SNSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 32 20" fill="none">
    <rect x="0.5" y="0.5" width="31" height="19" rx="2" stroke={color} strokeWidth="1" fill="none" />
    <text x="16" y="14" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="Arial" fill={color}>SN</text>
  </svg>
);

// CE 标志
export const CESymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 40 24" fill="none">
    <text x="20" y="19" textAnchor="middle" fontSize="20" fontWeight="bold" fontFamily="Arial" fill={color}>CE</text>
  </svg>
);

// MD 医疗器械标志
export const MDSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 32 22" fill="none">
    <rect x="0.5" y="0.5" width="31" height="21" rx="3" stroke={color} strokeWidth="1.5" fill="none" />
    <text x="16" y="16" textAnchor="middle" fontSize="13" fontWeight="bold" fontFamily="Arial" fill={color}>MD</text>
  </svg>
);

// UDI 标志
export const UDISymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 32 22" fill="none">
    <rect x="0.5" y="0.5" width="31" height="21" rx="3" stroke={color} strokeWidth="1.5" fill={color} />
    <text x="16" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="Arial" fill="#fff">UDI</text>
  </svg>
);

// EC REP 欧盟授权代表
export const ECRepSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 48 22" fill="none">
    <rect x="0.5" y="0.5" width="22" height="21" rx="2" stroke={color} strokeWidth="1.2" fill="none" />
    <text x="11.5" y="15" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="Arial" fill={color}>EC</text>
    <rect x="25" y="0.5" width="22" height="21" rx="2" stroke={color} strokeWidth="1.2" fill="none" />
    <text x="36" y="15" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="Arial" fill={color}>REP</text>
  </svg>
);

// 非无菌符号 (划掉的无菌)
export const NonSterileSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none" />
    <line x1="4" y1="4" x2="20" y2="20" stroke={color} strokeWidth="1.5" />
    <text x="12" y="16" textAnchor="middle" fontSize="7" fontFamily="Arial" fill={color}>STERILE</text>
  </svg>
);

// EO灭菌符号
export const SterileEOSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 60 22" fill="none">
    <rect x="0.5" y="0.5" width="59" height="21" rx="2" stroke={color} strokeWidth="1.2" fill="none" />
    <text x="30" y="15" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="Arial" fill={color}>STERILE EO</text>
  </svg>
);

// 注意符号 (三角感叹号)
export const CautionSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polygon points="12,2 22,22 2,22" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    <line x1="12" y1="9" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="19" r="1" fill={color} />
  </svg>
);

// 请阅读使用说明 (i符号)
export const ConsultIFUSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="7" r="1.2" fill={color} />
    <line x1="12" y1="10" x2="12" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 避免日晒符号
export const KeepFromSunSymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.3" fill="none" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x1 = 12 + 7 * Math.cos(rad);
      const y1 = 12 + 7 * Math.sin(rad);
      const x2 = 12 + 9.5 * Math.cos(rad);
      const y2 = 12 + 9.5 * Math.sin(rad);
      return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.3" />;
    })}
    <line x1="2" y1="2" x2="22" y2="22" stroke={color} strokeWidth="1.5" />
  </svg>
);

// 避免潮湿符号
export const KeepDrySymbol: React.FC<SymbolProps> = ({ size = 24, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 20 L12 4 L20 20 Z" stroke={color} strokeWidth="1.3" fill="none" />
    <line x1="6" y1="16" x2="18" y2="16" stroke={color} strokeWidth="1" />
    <line x1="7" y1="18" x2="17" y2="18" stroke={color} strokeWidth="1" />
  </svg>
);

// 符号注册表 - 用于编辑器工具箱
export const MEDICAL_SYMBOLS = [
  { id: "manufacturer", name: "制造商", Component: ManufacturerSymbol },
  { id: "mfgDate", name: "生产日期", Component: MfgDateSymbol },
  { id: "expiryDate", name: "有效期", Component: ExpiryDateSymbol },
  { id: "lot", name: "批号 LOT", Component: LotSymbol },
  { id: "ref", name: "参考号 REF", Component: RefSymbol },
  { id: "sn", name: "序列号 SN", Component: SNSymbol },
  { id: "ce", name: "CE 标志", Component: CESymbol },
  { id: "md", name: "MD 标志", Component: MDSymbol },
  { id: "udi", name: "UDI 标志", Component: UDISymbol },
  { id: "ecRep", name: "EC REP", Component: ECRepSymbol },
  { id: "nonSterile", name: "非无菌", Component: NonSterileSymbol },
  { id: "sterileEO", name: "EO灭菌", Component: SterileEOSymbol },
  { id: "caution", name: "注意", Component: CautionSymbol },
  { id: "consultIFU", name: "请阅读说明", Component: ConsultIFUSymbol },
  { id: "keepFromSun", name: "避免日晒", Component: KeepFromSunSymbol },
  { id: "keepDry", name: "避免潮湿", Component: KeepDrySymbol },
] as const;

export type MedicalSymbolId = typeof MEDICAL_SYMBOLS[number]["id"];

// 根据ID渲染符号
export function renderMedicalSymbol(symbolId: string, size: number = 24, color: string = "#000") {
  const sym = MEDICAL_SYMBOLS.find(s => s.id === symbolId);
  if (!sym) return null;
  const { Component } = sym;
  return <Component size={size} color={color} />;
}
