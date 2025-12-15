/**
 * POPIA/GDPR Compliance Checker (F145)
 * Automated compliance checking for data privacy requirements
 */

// Compliance Frameworks
export type ComplianceFramework = "gdpr" | "popia" | "ccpa" | "lgpd";

// Compliance Check Categories
export type ComplianceCategory =
  | "data_collection"
  | "consent_management"
  | "data_retention"
  | "data_access_rights"
  | "data_portability"
  | "right_to_erasure"
  | "privacy_notice"
  | "cookie_consent"
  | "breach_notification"
  | "cross_border_transfer"
  | "data_minimization"
  | "purpose_limitation"
  | "security_measures"
  | "record_keeping"
  | "dpo_appointment";

// Severity Levels
export type ComplianceSeverity = "critical" | "high" | "medium" | "low" | "info";

// Check Result Status
export type CheckStatus = "pass" | "fail" | "warning" | "not_applicable";

// Compliance Check Definition
export interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  category: ComplianceCategory;
  frameworks: ComplianceFramework[];
  severity: ComplianceSeverity;
  remediation: string;
  references: string[];
}

// Check Result
export interface ComplianceCheckResult {
  checkId: string;
  status: CheckStatus;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// Organization Configuration
export interface OrganizationComplianceConfig {
  organizationId: string;
  frameworks: ComplianceFramework[];
  dataTypes: string[];
  hasLegalBasis: boolean;
  hasConsentMechanism: boolean;
  hasPrivacyNotice: boolean;
  hasCookieConsent: boolean;
  hasBreachProcedure: boolean;
  hasDPO: boolean;
  dataRetentionPolicyDays: number;
  crossBorderTransfers: boolean;
  transferDestinations: string[];
  lastAuditDate?: Date;
  customChecks?: ComplianceCheck[];
}

// Compliance Report
export interface ComplianceReport {
  id: string;
  organizationId: string;
  frameworks: ComplianceFramework[];
  generatedAt: Date;
  overallScore: number;
  scoreByCategory: Record<ComplianceCategory, number>;
  scoreByFramework: Record<ComplianceFramework, number>;
  results: ComplianceCheckResult[];
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  recommendations: ComplianceRecommendation[];
}

// Compliance Recommendation
export interface ComplianceRecommendation {
  checkId: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  title: string;
  description: string;
  remediation: string;
  estimatedEffort: "low" | "medium" | "high";
  deadline?: Date;
}

// Compliance Checks Database
export const COMPLIANCE_CHECKS: ComplianceCheck[] = [
  // Data Collection
  {
    id: "DC001",
    name: "Lawful Basis for Processing",
    description: "Verify that a lawful basis exists for all data processing activities",
    category: "data_collection",
    frameworks: ["gdpr", "popia"],
    severity: "critical",
    remediation:
      "Document the lawful basis for each processing activity. Valid bases include consent, contract, legal obligation, vital interests, public task, or legitimate interests.",
    references: [
      "GDPR Article 6",
      "POPIA Section 8-12",
    ],
  },
  {
    id: "DC002",
    name: "Data Minimization",
    description: "Ensure only necessary data is collected for the stated purpose",
    category: "data_minimization",
    frameworks: ["gdpr", "popia", "ccpa"],
    severity: "high",
    remediation:
      "Review all data fields collected and remove any that are not strictly necessary for the stated purpose. Implement regular data audits.",
    references: [
      "GDPR Article 5(1)(c)",
      "POPIA Section 10",
    ],
  },
  {
    id: "DC003",
    name: "Purpose Specification",
    description: "Verify that the purpose of data collection is clearly specified",
    category: "purpose_limitation",
    frameworks: ["gdpr", "popia"],
    severity: "high",
    remediation:
      "Document the specific, explicit, and legitimate purpose for which data is collected. Update privacy notices to reflect these purposes.",
    references: [
      "GDPR Article 5(1)(b)",
      "POPIA Section 13",
    ],
  },

  // Consent Management
  {
    id: "CM001",
    name: "Valid Consent Mechanism",
    description: "Check that consent is freely given, specific, informed, and unambiguous",
    category: "consent_management",
    frameworks: ["gdpr", "popia", "ccpa"],
    severity: "critical",
    remediation:
      "Implement clear consent mechanisms with explicit opt-in (not pre-checked boxes). Document when and how consent was obtained.",
    references: [
      "GDPR Article 7",
      "POPIA Section 11",
    ],
  },
  {
    id: "CM002",
    name: "Consent Withdrawal Mechanism",
    description: "Verify users can easily withdraw consent",
    category: "consent_management",
    frameworks: ["gdpr", "popia"],
    severity: "high",
    remediation:
      "Provide an easy and accessible way for users to withdraw consent. Process withdrawal requests within the legal timeframe.",
    references: [
      "GDPR Article 7(3)",
      "POPIA Section 11(2)(d)",
    ],
  },
  {
    id: "CM003",
    name: "Special Category Data Consent",
    description: "Ensure explicit consent for sensitive/special category data",
    category: "consent_management",
    frameworks: ["gdpr", "popia"],
    severity: "critical",
    remediation:
      "Obtain explicit consent for processing sensitive data including health, biometrics, religious beliefs, and political opinions.",
    references: [
      "GDPR Article 9",
      "POPIA Section 26-32",
    ],
  },

  // Data Retention
  {
    id: "DR001",
    name: "Data Retention Policy",
    description: "Check for a documented data retention policy",
    category: "data_retention",
    frameworks: ["gdpr", "popia", "ccpa"],
    severity: "high",
    remediation:
      "Document retention periods for each data category. Implement automated deletion after retention period expires.",
    references: [
      "GDPR Article 5(1)(e)",
      "POPIA Section 14",
    ],
  },
  {
    id: "DR002",
    name: "Retention Period Compliance",
    description: "Verify data is not kept longer than necessary",
    category: "data_retention",
    frameworks: ["gdpr", "popia"],
    severity: "medium",
    remediation:
      "Regularly audit data storage and delete data that has exceeded its retention period. Document exceptions and their justification.",
    references: [
      "GDPR Article 17(1)(a)",
      "POPIA Section 14(1)",
    ],
  },

  // Data Subject Rights
  {
    id: "DSR001",
    name: "Right to Access Process",
    description: "Verify process exists for handling data access requests",
    category: "data_access_rights",
    frameworks: ["gdpr", "popia", "ccpa"],
    severity: "critical",
    remediation:
      "Implement a process to handle Subject Access Requests (SARs) within 30 days. Provide data in a commonly used electronic format.",
    references: [
      "GDPR Article 15",
      "POPIA Section 23",
    ],
  },
  {
    id: "DSR002",
    name: "Right to Rectification",
    description: "Verify process for correcting inaccurate data",
    category: "data_access_rights",
    frameworks: ["gdpr", "popia"],
    severity: "high",
    remediation:
      "Allow users to easily correct or update their personal data. Process correction requests promptly.",
    references: [
      "GDPR Article 16",
      "POPIA Section 24",
    ],
  },
  {
    id: "DSR003",
    name: "Right to Erasure (Deletion)",
    description: "Verify process for deleting user data on request",
    category: "right_to_erasure",
    frameworks: ["gdpr", "popia", "ccpa"],
    severity: "critical",
    remediation:
      "Implement a process to delete user data within 30 days of request. Document any legal exceptions that prevent deletion.",
    references: [
      "GDPR Article 17",
      "POPIA Section 24(1)(c)",
      "CCPA Section 1798.105",
    ],
  },
  {
    id: "DSR004",
    name: "Data Portability",
    description: "Verify ability to export user data in machine-readable format",
    category: "data_portability",
    frameworks: ["gdpr"],
    severity: "medium",
    remediation:
      "Provide data export in common formats (JSON, CSV). Allow direct transfer to other services where technically feasible.",
    references: ["GDPR Article 20"],
  },

  // Privacy Notice
  {
    id: "PN001",
    name: "Privacy Notice Availability",
    description: "Check that privacy notice is publicly available",
    category: "privacy_notice",
    frameworks: ["gdpr", "popia", "ccpa"],
    severity: "critical",
    remediation:
      "Publish a clear, accessible privacy notice on your website. Link to it from registration and data collection forms.",
    references: [
      "GDPR Articles 13-14",
      "POPIA Section 18",
    ],
  },
  {
    id: "PN002",
    name: "Privacy Notice Completeness",
    description: "Verify privacy notice contains all required information",
    category: "privacy_notice",
    frameworks: ["gdpr", "popia"],
    severity: "high",
    remediation:
      "Include: identity/contact details, purposes, legal basis, recipients, retention periods, data subject rights, and complaint procedures.",
    references: [
      "GDPR Articles 13(1-2)",
      "POPIA Section 18(1)",
    ],
  },
  {
    id: "PN003",
    name: "Privacy Notice Language",
    description: "Ensure privacy notice is clear and understandable",
    category: "privacy_notice",
    frameworks: ["gdpr", "popia"],
    severity: "medium",
    remediation:
      "Write in plain language avoiding legal jargon. Provide translations for major user languages.",
    references: [
      "GDPR Article 12(1)",
      "POPIA Section 18",
    ],
  },

  // Cookie Consent
  {
    id: "CC001",
    name: "Cookie Consent Banner",
    description: "Verify cookie consent mechanism is in place",
    category: "cookie_consent",
    frameworks: ["gdpr"],
    severity: "high",
    remediation:
      "Implement a cookie consent banner that blocks non-essential cookies until consent is given. Provide granular control options.",
    references: [
      "GDPR Article 7",
      "ePrivacy Directive Article 5(3)",
    ],
  },
  {
    id: "CC002",
    name: "Cookie Policy",
    description: "Check for documented cookie policy",
    category: "cookie_consent",
    frameworks: ["gdpr"],
    severity: "medium",
    remediation:
      "Document all cookies used, their purpose, and duration. Link cookie policy from consent banner.",
    references: ["ePrivacy Directive Article 5(3)"],
  },

  // Breach Notification
  {
    id: "BN001",
    name: "Breach Notification Procedure",
    description: "Verify data breach notification procedure exists",
    category: "breach_notification",
    frameworks: ["gdpr", "popia"],
    severity: "critical",
    remediation:
      "Document incident response procedures. Include templates for authority and affected individual notifications.",
    references: [
      "GDPR Articles 33-34",
      "POPIA Section 22",
    ],
  },
  {
    id: "BN002",
    name: "72-Hour Notification Capability",
    description: "Check ability to notify authorities within 72 hours",
    category: "breach_notification",
    frameworks: ["gdpr", "popia"],
    severity: "high",
    remediation:
      "Establish processes to detect, assess, and report breaches within 72 hours. Designate responsible personnel.",
    references: [
      "GDPR Article 33(1)",
      "POPIA Section 22(1)",
    ],
  },

  // Cross-Border Transfers
  {
    id: "CBT001",
    name: "International Transfer Safeguards",
    description: "Verify adequate safeguards for cross-border data transfers",
    category: "cross_border_transfer",
    frameworks: ["gdpr", "popia"],
    severity: "critical",
    remediation:
      "Implement Standard Contractual Clauses (SCCs), Binding Corporate Rules (BCRs), or ensure adequacy decisions exist for destination countries.",
    references: [
      "GDPR Articles 44-49",
      "POPIA Section 72",
    ],
  },
  {
    id: "CBT002",
    name: "Transfer Impact Assessment",
    description: "Check for transfer impact assessment documentation",
    category: "cross_border_transfer",
    frameworks: ["gdpr"],
    severity: "high",
    remediation:
      "Conduct Transfer Impact Assessments (TIAs) for transfers to non-adequate countries. Document supplementary measures.",
    references: ["GDPR Article 46", "Schrems II judgment"],
  },

  // Security Measures
  {
    id: "SM001",
    name: "Technical Security Measures",
    description: "Verify appropriate technical security measures are in place",
    category: "security_measures",
    frameworks: ["gdpr", "popia"],
    severity: "critical",
    remediation:
      "Implement encryption, access controls, regular security testing, and security monitoring. Document all measures.",
    references: [
      "GDPR Article 32",
      "POPIA Section 19",
    ],
  },
  {
    id: "SM002",
    name: "Organizational Security Measures",
    description: "Check for organizational security policies and training",
    category: "security_measures",
    frameworks: ["gdpr", "popia"],
    severity: "high",
    remediation:
      "Implement security awareness training, access management policies, and incident response procedures.",
    references: [
      "GDPR Article 32(1)(d)",
      "POPIA Section 19(2)",
    ],
  },

  // Record Keeping
  {
    id: "RK001",
    name: "Records of Processing Activities",
    description: "Verify maintenance of processing records",
    category: "record_keeping",
    frameworks: ["gdpr", "popia"],
    severity: "high",
    remediation:
      "Maintain detailed records of all processing activities including purposes, categories, recipients, and retention periods.",
    references: [
      "GDPR Article 30",
      "POPIA Section 14",
    ],
  },

  // DPO
  {
    id: "DPO001",
    name: "Data Protection Officer",
    description: "Check if DPO appointment is required and fulfilled",
    category: "dpo_appointment",
    frameworks: ["gdpr", "popia"],
    severity: "high",
    remediation:
      "Appoint a DPO if required by law (public authority, large-scale monitoring, or special category data). Register with supervisory authority.",
    references: [
      "GDPR Articles 37-39",
      "POPIA Section 55",
    ],
  },
];

// Adequacy Countries for GDPR
export const GDPR_ADEQUATE_COUNTRIES = [
  "Andorra",
  "Argentina",
  "Canada (commercial organizations)",
  "Faroe Islands",
  "Guernsey",
  "Israel",
  "Isle of Man",
  "Japan",
  "Jersey",
  "New Zealand",
  "Republic of Korea",
  "Switzerland",
  "United Kingdom",
  "Uruguay",
];

/**
 * Compliance Checker Class
 */
export class ComplianceChecker {
  private config: OrganizationComplianceConfig;

  constructor(config: OrganizationComplianceConfig) {
    this.config = config;
  }

  /**
   * Run all compliance checks
   */
  runAllChecks(): ComplianceReport {
    const results: ComplianceCheckResult[] = [];
    const recommendations: ComplianceRecommendation[] = [];

    // Get applicable checks based on frameworks
    const applicableChecks = COMPLIANCE_CHECKS.filter((check) =>
      check.frameworks.some((f) => this.config.frameworks.includes(f))
    );

    // Add custom checks if any
    const allChecks = [...applicableChecks, ...(this.config.customChecks || [])];

    // Run each check
    for (const check of allChecks) {
      const result = this.runCheck(check);
      results.push(result);

      if (result.status === "fail" || result.status === "warning") {
        recommendations.push({
          checkId: check.id,
          category: check.category,
          severity: check.severity,
          title: check.name,
          description: result.message,
          remediation: check.remediation,
          estimatedEffort: this.estimateEffort(check),
          deadline: this.calculateDeadline(check.severity),
        });
      }
    }

    // Calculate scores
    const scoreByCategory = this.calculateCategoryScores(results, allChecks);
    const scoreByFramework = this.calculateFrameworkScores(results, allChecks);
    const overallScore = this.calculateOverallScore(results);

    // Count issues by severity
    const criticalIssues = this.countIssuesBySeverity(results, allChecks, "critical");
    const highIssues = this.countIssuesBySeverity(results, allChecks, "high");
    const mediumIssues = this.countIssuesBySeverity(results, allChecks, "medium");
    const lowIssues = this.countIssuesBySeverity(results, allChecks, "low");

    return {
      id: `report_${Date.now()}`,
      organizationId: this.config.organizationId,
      frameworks: this.config.frameworks,
      generatedAt: new Date(),
      overallScore,
      scoreByCategory,
      scoreByFramework,
      results,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      recommendations: this.prioritizeRecommendations(recommendations),
    };
  }

  /**
   * Run individual check
   */
  private runCheck(check: ComplianceCheck): ComplianceCheckResult {
    const now = new Date();

    switch (check.id) {
      // Data Collection Checks
      case "DC001":
        return {
          checkId: check.id,
          status: this.config.hasLegalBasis ? "pass" : "fail",
          message: this.config.hasLegalBasis
            ? "Lawful basis for processing is documented"
            : "No documented lawful basis for processing activities",
          timestamp: now,
        };

      case "DC002":
        return {
          checkId: check.id,
          status: this.config.dataTypes.length <= 10 ? "pass" : "warning",
          message:
            this.config.dataTypes.length <= 10
              ? "Data collection appears minimized"
              : `Collecting ${this.config.dataTypes.length} data types - review for necessity`,
          details: { dataTypesCount: this.config.dataTypes.length },
          timestamp: now,
        };

      case "DC003":
        return {
          checkId: check.id,
          status: this.config.hasPrivacyNotice ? "pass" : "fail",
          message: this.config.hasPrivacyNotice
            ? "Purpose specification documented in privacy notice"
            : "No privacy notice documenting data collection purposes",
          timestamp: now,
        };

      // Consent Management Checks
      case "CM001":
        return {
          checkId: check.id,
          status: this.config.hasConsentMechanism ? "pass" : "fail",
          message: this.config.hasConsentMechanism
            ? "Valid consent mechanism is in place"
            : "No valid consent mechanism detected",
          timestamp: now,
        };

      case "CM002":
        return {
          checkId: check.id,
          status: this.config.hasConsentMechanism ? "pass" : "fail",
          message: this.config.hasConsentMechanism
            ? "Consent withdrawal mechanism available"
            : "No consent withdrawal mechanism",
          timestamp: now,
        };

      case "CM003": {
        const hasSensitiveData = this.config.dataTypes.some((t) =>
          ["health", "biometric", "religion", "political", "sexual_orientation", "race"].includes(
            t.toLowerCase()
          )
        );
        return {
          checkId: check.id,
          status: hasSensitiveData
            ? this.config.hasConsentMechanism
              ? "pass"
              : "fail"
            : "not_applicable",
          message: hasSensitiveData
            ? this.config.hasConsentMechanism
              ? "Explicit consent for sensitive data in place"
              : "Missing explicit consent for sensitive data"
            : "No sensitive data categories detected",
          timestamp: now,
        };
      }

      // Data Retention Checks
      case "DR001":
        return {
          checkId: check.id,
          status: this.config.dataRetentionPolicyDays > 0 ? "pass" : "fail",
          message:
            this.config.dataRetentionPolicyDays > 0
              ? `Data retention policy: ${this.config.dataRetentionPolicyDays} days`
              : "No data retention policy defined",
          details: { retentionDays: this.config.dataRetentionPolicyDays },
          timestamp: now,
        };

      case "DR002": {
        const retentionOk =
          this.config.dataRetentionPolicyDays > 0 && this.config.dataRetentionPolicyDays <= 2555; // ~7 years
        return {
          checkId: check.id,
          status: retentionOk ? "pass" : "warning",
          message: retentionOk
            ? "Retention period within acceptable range"
            : `Retention period (${this.config.dataRetentionPolicyDays} days) may be excessive`,
          timestamp: now,
        };
      }

      // Data Subject Rights Checks
      case "DSR001":
      case "DSR002":
      case "DSR003":
        return {
          checkId: check.id,
          status: this.config.hasPrivacyNotice ? "pass" : "fail",
          message: this.config.hasPrivacyNotice
            ? "Data subject rights process documented"
            : "No documented process for data subject requests",
          timestamp: now,
        };

      case "DSR004":
        return {
          checkId: check.id,
          status: this.config.frameworks.includes("gdpr") ? "warning" : "not_applicable",
          message: this.config.frameworks.includes("gdpr")
            ? "Data portability feature should be implemented"
            : "Data portability not required by selected frameworks",
          timestamp: now,
        };

      // Privacy Notice Checks
      case "PN001":
      case "PN002":
      case "PN003":
        return {
          checkId: check.id,
          status: this.config.hasPrivacyNotice ? "pass" : "fail",
          message: this.config.hasPrivacyNotice
            ? "Privacy notice is available and documented"
            : "Privacy notice is missing or incomplete",
          timestamp: now,
        };

      // Cookie Consent Checks
      case "CC001":
      case "CC002":
        return {
          checkId: check.id,
          status: this.config.hasCookieConsent ? "pass" : "fail",
          message: this.config.hasCookieConsent
            ? "Cookie consent mechanism in place"
            : "Cookie consent mechanism missing",
          timestamp: now,
        };

      // Breach Notification Checks
      case "BN001":
      case "BN002":
        return {
          checkId: check.id,
          status: this.config.hasBreachProcedure ? "pass" : "fail",
          message: this.config.hasBreachProcedure
            ? "Data breach notification procedure documented"
            : "No data breach notification procedure",
          timestamp: now,
        };

      // Cross-Border Transfer Checks
      case "CBT001": {
        if (!this.config.crossBorderTransfers) {
          return {
            checkId: check.id,
            status: "not_applicable",
            message: "No cross-border transfers configured",
            timestamp: now,
          };
        }
        const allAdequate = this.config.transferDestinations.every((dest) =>
          GDPR_ADEQUATE_COUNTRIES.includes(dest)
        );
        return {
          checkId: check.id,
          status: allAdequate ? "pass" : "warning",
          message: allAdequate
            ? "All transfer destinations have adequacy decisions"
            : "Some destinations require additional safeguards",
          details: { destinations: this.config.transferDestinations },
          timestamp: now,
        };
      }

      case "CBT002":
        return {
          checkId: check.id,
          status: this.config.crossBorderTransfers ? "warning" : "not_applicable",
          message: this.config.crossBorderTransfers
            ? "Transfer Impact Assessment recommended"
            : "No cross-border transfers",
          timestamp: now,
        };

      // Security Measures Checks
      case "SM001":
      case "SM002":
        return {
          checkId: check.id,
          status: "warning",
          message: "Security measures should be regularly reviewed and documented",
          timestamp: now,
        };

      // Record Keeping Check
      case "RK001":
        return {
          checkId: check.id,
          status: this.config.hasPrivacyNotice ? "pass" : "fail",
          message: this.config.hasPrivacyNotice
            ? "Processing records documented"
            : "Records of processing activities missing",
          timestamp: now,
        };

      // DPO Check
      case "DPO001":
        return {
          checkId: check.id,
          status: this.config.hasDPO ? "pass" : "warning",
          message: this.config.hasDPO
            ? "Data Protection Officer appointed"
            : "Consider appointing a DPO if required",
          timestamp: now,
        };

      default:
        return {
          checkId: check.id,
          status: "warning",
          message: "Check not implemented - manual review required",
          timestamp: now,
        };
    }
  }

  /**
   * Calculate category scores
   */
  private calculateCategoryScores(
    results: ComplianceCheckResult[],
    checks: ComplianceCheck[]
  ): Record<ComplianceCategory, number> {
    const scores: Partial<Record<ComplianceCategory, number>> = {};
    const categories = [...new Set(checks.map((c) => c.category))];

    for (const category of categories) {
      const categoryResults = results.filter((r) => {
        const check = checks.find((c) => c.id === r.checkId);
        return check?.category === category;
      });

      if (categoryResults.length === 0) {
        scores[category] = 100;
        continue;
      }

      const passed = categoryResults.filter(
        (r) => r.status === "pass" || r.status === "not_applicable"
      ).length;
      scores[category] = Math.round((passed / categoryResults.length) * 100);
    }

    return scores as Record<ComplianceCategory, number>;
  }

  /**
   * Calculate framework scores
   */
  private calculateFrameworkScores(
    results: ComplianceCheckResult[],
    checks: ComplianceCheck[]
  ): Record<ComplianceFramework, number> {
    const scores: Partial<Record<ComplianceFramework, number>> = {};

    for (const framework of this.config.frameworks) {
      const frameworkChecks = checks.filter((c) => c.frameworks.includes(framework));
      const frameworkResults = results.filter((r) =>
        frameworkChecks.some((c) => c.id === r.checkId)
      );

      if (frameworkResults.length === 0) {
        scores[framework] = 100;
        continue;
      }

      const passed = frameworkResults.filter(
        (r) => r.status === "pass" || r.status === "not_applicable"
      ).length;
      scores[framework] = Math.round((passed / frameworkResults.length) * 100);
    }

    return scores as Record<ComplianceFramework, number>;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(results: ComplianceCheckResult[]): number {
    if (results.length === 0) return 100;

    const applicable = results.filter((r) => r.status !== "not_applicable");
    if (applicable.length === 0) return 100;

    const passed = applicable.filter((r) => r.status === "pass").length;
    const warned = applicable.filter((r) => r.status === "warning").length;

    // Warnings count as half points
    return Math.round(((passed + warned * 0.5) / applicable.length) * 100);
  }

  /**
   * Count issues by severity
   */
  private countIssuesBySeverity(
    results: ComplianceCheckResult[],
    checks: ComplianceCheck[],
    severity: ComplianceSeverity
  ): number {
    return results.filter((r) => {
      if (r.status !== "fail" && r.status !== "warning") return false;
      const check = checks.find((c) => c.id === r.checkId);
      return check?.severity === severity;
    }).length;
  }

  /**
   * Estimate remediation effort
   */
  private estimateEffort(check: ComplianceCheck): "low" | "medium" | "high" {
    switch (check.category) {
      case "privacy_notice":
      case "cookie_consent":
        return "low";
      case "consent_management":
      case "data_access_rights":
      case "data_retention":
        return "medium";
      case "security_measures":
      case "cross_border_transfer":
      case "breach_notification":
        return "high";
      default:
        return "medium";
    }
  }

  /**
   * Calculate deadline based on severity
   */
  private calculateDeadline(severity: ComplianceSeverity): Date {
    const now = new Date();
    switch (severity) {
      case "critical":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      case "high":
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      case "medium":
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
      case "low":
        return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days
      default:
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }
  }

  /**
   * Prioritize recommendations
   */
  private prioritizeRecommendations(
    recommendations: ComplianceRecommendation[]
  ): ComplianceRecommendation[] {
    const severityOrder: Record<ComplianceSeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    };

    return recommendations.sort((a, b) => {
      // First by severity
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by effort (prefer lower effort)
      const effortOrder = { low: 0, medium: 1, high: 2 };
      return effortOrder[a.estimatedEffort] - effortOrder[b.estimatedEffort];
    });
  }

  /**
   * Get quick summary
   */
  getSummary(): {
    isCompliant: boolean;
    overallScore: number;
    criticalIssues: number;
    nextAction: string;
  } {
    const report = this.runAllChecks();

    let nextAction = "No immediate action required";
    if (report.criticalIssues > 0) {
      const firstCritical = report.recommendations.find((r) => r.severity === "critical");
      nextAction = firstCritical
        ? `Address: ${firstCritical.title}`
        : "Address critical compliance issues";
    } else if (report.highIssues > 0) {
      const firstHigh = report.recommendations.find((r) => r.severity === "high");
      nextAction = firstHigh ? `Review: ${firstHigh.title}` : "Review high-priority issues";
    }

    return {
      isCompliant: report.criticalIssues === 0 && report.overallScore >= 80,
      overallScore: report.overallScore,
      criticalIssues: report.criticalIssues,
      nextAction,
    };
  }
}

// Singleton instance
let complianceChecker: ComplianceChecker | null = null;

export function getComplianceChecker(config: OrganizationComplianceConfig): ComplianceChecker {
  if (!complianceChecker || complianceChecker["config"].organizationId !== config.organizationId) {
    complianceChecker = new ComplianceChecker(config);
  }
  return complianceChecker;
}

// Export convenience function
export function runComplianceCheck(config: OrganizationComplianceConfig): ComplianceReport {
  const checker = new ComplianceChecker(config);
  return checker.runAllChecks();
}
