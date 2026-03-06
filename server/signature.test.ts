import { describe, expect, it, vi } from "vitest";

// 电子签名类型定义
interface SignatureRecord {
  id: number;
  signatureType: "inspector" | "reviewer" | "approver";
  signatureAction: string;
  signerName: string;
  signerTitle?: string;
  signerDepartment?: string;
  signedAt: string;
  signatureMeaning: string;
  status: "valid" | "revoked";
}

// 签名含义映射 (FDA 21 CFR Part 11 合规)
const signatureMeaningMap = {
  inspector: {
    IQC: "本人确认已按照检验规程对来料进行检验，检验结果真实、准确、完整。",
    IPQC: "本人确认已按照过程检验规程进行检验，检验结果真实、准确、完整。",
    OQC: "本人确认已按照成品检验规程进行检验，检验结果真实、准确、完整。",
  },
  reviewer: {
    IQC: "本人确认已复核检验记录，数据真实可靠，检验方法符合规定。",
    IPQC: "本人确认已复核过程检验记录，数据真实可靠，检验方法符合规定。",
    OQC: "本人确认已复核成品检验记录，数据真实可靠，检验方法符合规定。",
  },
  approver: {
    IQC: "本人批准该来料检验报告，同意检验结论。",
    IPQC: "本人批准该过程检验报告，同意检验结论。",
    OQC: "本人批准该成品检验报告，产品符合放行条件。",
  },
};

// 验证签名是否完整 (三级签名)
function isSignatureComplete(signatures: SignatureRecord[]): boolean {
  const validSignatures = signatures.filter((s) => s.status === "valid");
  const hasInspector = validSignatures.some((s) => s.signatureType === "inspector");
  const hasReviewer = validSignatures.some((s) => s.signatureType === "reviewer");
  const hasApprover = validSignatures.some((s) => s.signatureType === "approver");
  return hasInspector && hasReviewer && hasApprover;
}

// 验证签名顺序 (检验员 -> 复核员 -> 审批人)
function validateSignatureOrder(signatures: SignatureRecord[]): boolean {
  const validSignatures = signatures
    .filter((s) => s.status === "valid")
    .sort((a, b) => new Date(a.signedAt).getTime() - new Date(b.signedAt).getTime());

  if (validSignatures.length === 0) return true;

  const order = ["inspector", "reviewer", "approver"];
  let currentIndex = 0;

  for (const sig of validSignatures) {
    const sigIndex = order.indexOf(sig.signatureType);
    if (sigIndex < currentIndex) {
      return false; // 签名顺序错误
    }
    currentIndex = sigIndex;
  }

  return true;
}

// 检查是否可以进行下一步签名
function canSign(
  signatures: SignatureRecord[],
  signatureType: "inspector" | "reviewer" | "approver"
): boolean {
  const validSignatures = signatures.filter((s) => s.status === "valid");

  // 检查是否已经签过
  if (validSignatures.some((s) => s.signatureType === signatureType)) {
    return false;
  }

  // 检查前置签名
  if (signatureType === "reviewer") {
    return validSignatures.some((s) => s.signatureType === "inspector");
  }

  if (signatureType === "approver") {
    return validSignatures.some((s) => s.signatureType === "reviewer");
  }

  return true; // inspector 可以直接签名
}

// 生成审计日志条目
function createAuditLogEntry(
  action: string,
  userId: number,
  userName: string,
  documentNo: string,
  details: Record<string, unknown>
) {
  return {
    action,
    userId,
    userName,
    documentNo,
    details: JSON.stringify(details),
    timestamp: new Date().toISOString(),
    ipAddress: "127.0.0.1",
  };
}

describe("Electronic Signature - FDA 21 CFR Part 11 Compliance", () => {
  describe("Signature Meaning Validation", () => {
    it("should have correct signature meaning for IQC inspector", () => {
      const meaning = signatureMeaningMap.inspector.IQC;
      expect(meaning).toContain("来料");
      expect(meaning).toContain("检验规程");
      expect(meaning).toContain("真实");
    });

    it("should have correct signature meaning for OQC approver", () => {
      const meaning = signatureMeaningMap.approver.OQC;
      expect(meaning).toContain("成品检验");
      expect(meaning).toContain("放行");
    });

    it("should have different meanings for different inspection types", () => {
      expect(signatureMeaningMap.inspector.IQC).not.toBe(signatureMeaningMap.inspector.IPQC);
      expect(signatureMeaningMap.inspector.IPQC).not.toBe(signatureMeaningMap.inspector.OQC);
    });
  });

  describe("Signature Completeness Check", () => {
    it("should return true when all three signatures are present", () => {
      const signatures: SignatureRecord[] = [
        {
          id: 1,
          signatureType: "inspector",
          signatureAction: "IQC检验检验员签名",
          signerName: "张检验员",
          signedAt: "2026-01-28T10:00:00",
          signatureMeaning: signatureMeaningMap.inspector.IQC,
          status: "valid",
        },
        {
          id: 2,
          signatureType: "reviewer",
          signatureAction: "IQC检验复核员签名",
          signerName: "王复核",
          signedAt: "2026-01-28T11:00:00",
          signatureMeaning: signatureMeaningMap.reviewer.IQC,
          status: "valid",
        },
        {
          id: 3,
          signatureType: "approver",
          signatureAction: "IQC检验审批人签名",
          signerName: "李经理",
          signedAt: "2026-01-28T14:00:00",
          signatureMeaning: signatureMeaningMap.approver.IQC,
          status: "valid",
        },
      ];

      expect(isSignatureComplete(signatures)).toBe(true);
    });

    it("should return false when reviewer signature is missing", () => {
      const signatures: SignatureRecord[] = [
        {
          id: 1,
          signatureType: "inspector",
          signatureAction: "IQC检验检验员签名",
          signerName: "张检验员",
          signedAt: "2026-01-28T10:00:00",
          signatureMeaning: signatureMeaningMap.inspector.IQC,
          status: "valid",
        },
        {
          id: 3,
          signatureType: "approver",
          signatureAction: "IQC检验审批人签名",
          signerName: "李经理",
          signedAt: "2026-01-28T14:00:00",
          signatureMeaning: signatureMeaningMap.approver.IQC,
          status: "valid",
        },
      ];

      expect(isSignatureComplete(signatures)).toBe(false);
    });

    it("should ignore revoked signatures", () => {
      const signatures: SignatureRecord[] = [
        {
          id: 1,
          signatureType: "inspector",
          signatureAction: "IQC检验检验员签名",
          signerName: "张检验员",
          signedAt: "2026-01-28T10:00:00",
          signatureMeaning: signatureMeaningMap.inspector.IQC,
          status: "revoked",
        },
        {
          id: 2,
          signatureType: "reviewer",
          signatureAction: "IQC检验复核员签名",
          signerName: "王复核",
          signedAt: "2026-01-28T11:00:00",
          signatureMeaning: signatureMeaningMap.reviewer.IQC,
          status: "valid",
        },
        {
          id: 3,
          signatureType: "approver",
          signatureAction: "IQC检验审批人签名",
          signerName: "李经理",
          signedAt: "2026-01-28T14:00:00",
          signatureMeaning: signatureMeaningMap.approver.IQC,
          status: "valid",
        },
      ];

      expect(isSignatureComplete(signatures)).toBe(false);
    });
  });

  describe("Signature Order Validation", () => {
    it("should validate correct signature order", () => {
      const signatures: SignatureRecord[] = [
        {
          id: 1,
          signatureType: "inspector",
          signatureAction: "检验员签名",
          signerName: "张检验员",
          signedAt: "2026-01-28T10:00:00",
          signatureMeaning: "检验确认",
          status: "valid",
        },
        {
          id: 2,
          signatureType: "reviewer",
          signatureAction: "复核员签名",
          signerName: "王复核",
          signedAt: "2026-01-28T11:00:00",
          signatureMeaning: "复核确认",
          status: "valid",
        },
        {
          id: 3,
          signatureType: "approver",
          signatureAction: "审批人签名",
          signerName: "李经理",
          signedAt: "2026-01-28T14:00:00",
          signatureMeaning: "审批确认",
          status: "valid",
        },
      ];

      expect(validateSignatureOrder(signatures)).toBe(true);
    });

    it("should reject incorrect signature order", () => {
      const signatures: SignatureRecord[] = [
        {
          id: 1,
          signatureType: "approver",
          signatureAction: "审批人签名",
          signerName: "李经理",
          signedAt: "2026-01-28T10:00:00",
          signatureMeaning: "审批确认",
          status: "valid",
        },
        {
          id: 2,
          signatureType: "inspector",
          signatureAction: "检验员签名",
          signerName: "张检验员",
          signedAt: "2026-01-28T11:00:00",
          signatureMeaning: "检验确认",
          status: "valid",
        },
      ];

      expect(validateSignatureOrder(signatures)).toBe(false);
    });
  });

  describe("Signature Permission Check", () => {
    it("should allow inspector to sign first", () => {
      const signatures: SignatureRecord[] = [];
      expect(canSign(signatures, "inspector")).toBe(true);
    });

    it("should not allow reviewer to sign before inspector", () => {
      const signatures: SignatureRecord[] = [];
      expect(canSign(signatures, "reviewer")).toBe(false);
    });

    it("should allow reviewer to sign after inspector", () => {
      const signatures: SignatureRecord[] = [
        {
          id: 1,
          signatureType: "inspector",
          signatureAction: "检验员签名",
          signerName: "张检验员",
          signedAt: "2026-01-28T10:00:00",
          signatureMeaning: "检验确认",
          status: "valid",
        },
      ];
      expect(canSign(signatures, "reviewer")).toBe(true);
    });

    it("should not allow approver to sign before reviewer", () => {
      const signatures: SignatureRecord[] = [
        {
          id: 1,
          signatureType: "inspector",
          signatureAction: "检验员签名",
          signerName: "张检验员",
          signedAt: "2026-01-28T10:00:00",
          signatureMeaning: "检验确认",
          status: "valid",
        },
      ];
      expect(canSign(signatures, "approver")).toBe(false);
    });

    it("should not allow duplicate signatures", () => {
      const signatures: SignatureRecord[] = [
        {
          id: 1,
          signatureType: "inspector",
          signatureAction: "检验员签名",
          signerName: "张检验员",
          signedAt: "2026-01-28T10:00:00",
          signatureMeaning: "检验确认",
          status: "valid",
        },
      ];
      expect(canSign(signatures, "inspector")).toBe(false);
    });
  });

  describe("Audit Log Generation", () => {
    it("should create audit log entry with required fields", () => {
      const entry = createAuditLogEntry(
        "signature_completed",
        1,
        "张检验员",
        "IQC-2026-0128",
        { signatureType: "inspector", documentType: "IQC" }
      );

      expect(entry.action).toBe("signature_completed");
      expect(entry.userId).toBe(1);
      expect(entry.userName).toBe("张检验员");
      expect(entry.documentNo).toBe("IQC-2026-0128");
      expect(entry.timestamp).toBeDefined();
      expect(entry.ipAddress).toBeDefined();
    });

    it("should serialize details as JSON", () => {
      const entry = createAuditLogEntry(
        "signature_completed",
        1,
        "张检验员",
        "IQC-2026-0128",
        { signatureType: "inspector", documentType: "IQC" }
      );

      const details = JSON.parse(entry.details);
      expect(details.signatureType).toBe("inspector");
      expect(details.documentType).toBe("IQC");
    });
  });
});

describe("Electronic Signature - Business Logic", () => {
  it("should calculate signature progress correctly", () => {
    const calculateProgress = (signatures: SignatureRecord[]): number => {
      const validCount = signatures.filter((s) => s.status === "valid").length;
      return Math.round((validCount / 3) * 100);
    };

    expect(calculateProgress([])).toBe(0);
    expect(
      calculateProgress([
        {
          id: 1,
          signatureType: "inspector",
          signatureAction: "签名",
          signerName: "张检验员",
          signedAt: "2026-01-28T10:00:00",
          signatureMeaning: "确认",
          status: "valid",
        },
      ])
    ).toBe(33);
  });

  it("should determine release status based on signatures", () => {
    const isReleased = (signatures: SignatureRecord[]): boolean => {
      return isSignatureComplete(signatures);
    };

    const completeSignatures: SignatureRecord[] = [
      {
        id: 1,
        signatureType: "inspector",
        signatureAction: "签名",
        signerName: "张检验员",
        signedAt: "2026-01-28T10:00:00",
        signatureMeaning: "确认",
        status: "valid",
      },
      {
        id: 2,
        signatureType: "reviewer",
        signatureAction: "签名",
        signerName: "王复核",
        signedAt: "2026-01-28T11:00:00",
        signatureMeaning: "确认",
        status: "valid",
      },
      {
        id: 3,
        signatureType: "approver",
        signatureAction: "签名",
        signerName: "李经理",
        signedAt: "2026-01-28T14:00:00",
        signatureMeaning: "确认",
        status: "valid",
      },
    ];

    expect(isReleased(completeSignatures)).toBe(true);
    expect(isReleased([])).toBe(false);
  });
});
