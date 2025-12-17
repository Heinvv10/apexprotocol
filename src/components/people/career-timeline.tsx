"use client";

/**
 * CareerTimeline Component (Phase 9.3)
 *
 * Displays career history as a vertical timeline.
 * Shows positions, companies, and duration.
 */

import { cn } from "@/lib/utils";
import {
  Building2,
  Calendar,
  MapPin,
  GraduationCap,
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CareerPosition {
  title: string;
  company: string;
  companyLinkedinUrl?: string;
  location?: string;
  startDate: string; // YYYY-MM format
  endDate?: string; // YYYY-MM format or null for current
  isCurrent?: boolean;
  description?: string;
}

interface Education {
  school: string;
  schoolLinkedinUrl?: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: string;
  endYear?: string;
  description?: string;
}

interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

interface CareerTimelineProps {
  positions?: CareerPosition[];
  education?: Education[];
  certifications?: Certification[];
  currentPosition?: string;
  currentCompany?: string;
  totalYearsExperience?: number;
  maxInitialItems?: number;
  className?: string;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "Present";
  const [year, month] = dateStr.split("-");
  if (!month) return year;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

function calculateDuration(startDate: string, endDate?: string): string {
  const start = new Date(startDate + "-01");
  const end = endDate ? new Date(endDate + "-01") : new Date();

  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} mo${remainingMonths !== 1 ? "s" : ""}`;
  }
  if (remainingMonths === 0) {
    return `${years} yr${years !== 1 ? "s" : ""}`;
  }
  return `${years} yr${years !== 1 ? "s" : ""} ${remainingMonths} mo${remainingMonths !== 1 ? "s" : ""}`;
}

export function CareerTimeline({
  positions = [],
  education = [],
  certifications = [],
  currentPosition,
  currentCompany,
  totalYearsExperience,
  maxInitialItems = 3,
  className,
}: CareerTimelineProps) {
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [showAllEducation, setShowAllEducation] = useState(false);
  const [showAllCertifications, setShowAllCertifications] = useState(false);

  const hasContent = positions.length > 0 || education.length > 0 || certifications.length > 0;

  if (!hasContent && !currentPosition) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No career history available</p>
        <p className="text-xs">Enrich this profile to see career timeline</p>
      </div>
    );
  }

  const displayedPositions = showAllPositions
    ? positions
    : positions.slice(0, maxInitialItems);
  const displayedEducation = showAllEducation
    ? education
    : education.slice(0, maxInitialItems);
  const displayedCertifications = showAllCertifications
    ? certifications
    : certifications.slice(0, maxInitialItems);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Experience Summary */}
      {totalYearsExperience !== undefined && totalYearsExperience > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{totalYearsExperience}+ years of experience</span>
        </div>
      )}

      {/* Current Position (if different from positions list) */}
      {currentPosition && currentCompany && positions.length === 0 && (
        <div className="card-tertiary p-3 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{currentPosition}</p>
              <p className="text-xs text-muted-foreground">{currentCompany}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-green-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Current
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work Experience */}
      {positions.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Experience
          </h4>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {displayedPositions.map((position, index) => (
                <TimelineItem
                  key={`${position.company}-${position.startDate}-${index}`}
                  position={position}
                  isFirst={index === 0}
                />
              ))}
            </div>

            {positions.length > maxInitialItems && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllPositions(!showAllPositions)}
                className="mt-2 ml-6 text-xs"
              >
                {showAllPositions ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {positions.length - maxInitialItems} more
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Education
          </h4>
          <div className="space-y-3">
            {displayedEducation.map((edu, index) => (
              <EducationItem key={`${edu.school}-${index}`} education={edu} />
            ))}
          </div>

          {education.length > maxInitialItems && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllEducation(!showAllEducation)}
              className="mt-2 text-xs"
            >
              {showAllEducation ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show {education.length - maxInitialItems} more
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certifications
          </h4>
          <div className="flex flex-wrap gap-2">
            {displayedCertifications.map((cert, index) => (
              <CertificationBadge key={`${cert.name}-${index}`} certification={cert} />
            ))}
          </div>

          {certifications.length > maxInitialItems && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllCertifications(!showAllCertifications)}
              className="mt-2 text-xs"
            >
              {showAllCertifications ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show {certifications.length - maxInitialItems} more
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Need to import this at the top level
import { Briefcase } from "lucide-react";

function TimelineItem({
  position,
  isFirst,
}: {
  position: CareerPosition;
  isFirst: boolean;
}) {
  const isCurrent = position.isCurrent || !position.endDate;

  return (
    <div className="relative pl-10">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-2 w-4 h-4 rounded-full border-2 bg-background",
          isCurrent ? "border-green-500" : "border-muted-foreground"
        )}
      >
        {isCurrent && (
          <div className="absolute inset-1 rounded-full bg-green-500 animate-pulse" />
        )}
      </div>

      <div className="card-tertiary p-3 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm">{position.title}</p>
            <div className="flex items-center gap-1">
              {position.companyLinkedinUrl ? (
                <a
                  href={position.companyLinkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {position.company}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">{position.company}</span>
              )}
            </div>
          </div>
          {isCurrent && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
              Current
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>
            {formatDate(position.startDate)} - {formatDate(position.endDate)}
          </span>
          <span>•</span>
          <span>{calculateDuration(position.startDate, position.endDate)}</span>
        </div>

        {position.location && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {position.location}
          </div>
        )}

        {position.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {position.description}
          </p>
        )}
      </div>
    </div>
  );
}

function EducationItem({ education }: { education: Education }) {
  return (
    <div className="card-tertiary p-3 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <GraduationCap className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{education.school}</p>
          {education.degree && (
            <p className="text-xs text-muted-foreground">
              {education.degree}
              {education.fieldOfStudy && ` in ${education.fieldOfStudy}`}
            </p>
          )}
          {(education.startYear || education.endYear) && (
            <p className="text-xs text-muted-foreground mt-1">
              {education.startYear || ""} - {education.endYear || "Present"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CertificationBadge({ certification }: { certification: Certification }) {
  const content = (
    <div className="card-tertiary px-3 py-2 rounded-lg text-xs inline-flex items-center gap-2">
      <Award className="h-3 w-3 text-amber-500" />
      <div>
        <p className="font-medium">{certification.name}</p>
        <p className="text-muted-foreground">{certification.issuingOrganization}</p>
      </div>
    </div>
  );

  if (certification.credentialUrl) {
    return (
      <a
        href={certification.credentialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        {content}
      </a>
    );
  }

  return content;
}
