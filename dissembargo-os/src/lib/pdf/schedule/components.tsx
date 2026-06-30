import { Text, View } from "@react-pdf/renderer";
import { MILESTONE_TYPE_LABELS } from "@/lib/production-schedules/constants";
import type { SchedulePdfData } from "./types";
import { schedulePdfStyles } from "./styles";

export function PdfScheduleHeader({ data }: { data: SchedulePdfData }) {
  return (
    <View style={schedulePdfStyles.headerRow}>
      <View>
        <Text style={schedulePdfStyles.agencyName}>{data.agencyName}</Text>
        <Text style={schedulePdfStyles.agencyTagline}>{data.tagline}</Text>
        <Text
          style={{
            fontSize: 8,
            color: data.brand.colors.muted,
            marginTop: 4,
          }}
        >
          {data.email} · {data.website}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={schedulePdfStyles.docLabel}>Production Schedule</Text>
        <Text style={schedulePdfStyles.docTitle}>{data.projectTitle}</Text>
        <Text style={schedulePdfStyles.versionBadge}>
          Version {data.versionNumber}
        </Text>
      </View>
    </View>
  );
}

export function PdfScheduleMetaGrid({ data }: { data: SchedulePdfData }) {
  return (
    <View style={schedulePdfStyles.metaGrid}>
      <View style={schedulePdfStyles.metaItem}>
        <Text style={schedulePdfStyles.metaLabel}>Client</Text>
        <Text style={schedulePdfStyles.metaValue}>{data.clientName}</Text>
      </View>
      <View style={schedulePdfStyles.metaItem}>
        <Text style={schedulePdfStyles.metaLabel}>Schedule Created</Text>
        <Text style={schedulePdfStyles.metaValue}>{data.createdDate}</Text>
      </View>
      <View style={schedulePdfStyles.metaItem}>
        <Text style={schedulePdfStyles.metaLabel}>Project Start</Text>
        <Text style={schedulePdfStyles.metaValue}>{data.startDate}</Text>
      </View>
      <View style={schedulePdfStyles.metaItem}>
        <Text style={schedulePdfStyles.metaLabel}>Delivery Date</Text>
        <Text style={schedulePdfStyles.metaValue}>{data.deliveryDate}</Text>
      </View>
    </View>
  );
}

export function PdfScheduleOverview({ data }: { data: SchedulePdfData }) {
  return (
    <View>
      <Text style={schedulePdfStyles.sectionTitle}>Project Overview</Text>
      <View style={schedulePdfStyles.overviewGrid}>
        <View style={schedulePdfStyles.overviewCard}>
          <Text style={schedulePdfStyles.overviewValue}>
            {data.deliverables.length}
          </Text>
          <Text style={schedulePdfStyles.overviewLabel}>Deliverables</Text>
        </View>
        <View style={schedulePdfStyles.overviewCard}>
          <Text style={schedulePdfStyles.overviewValue}>
            {data.reviewRounds}
          </Text>
          <Text style={schedulePdfStyles.overviewLabel}>Review Rounds</Text>
        </View>
        <View style={schedulePdfStyles.overviewCard}>
          <Text style={schedulePdfStyles.overviewValue}>
            {data.totalDurationDays}
          </Text>
          <Text style={schedulePdfStyles.overviewLabel}>
            Total Production Days
          </Text>
        </View>
      </View>
    </View>
  );
}

export function PdfScheduleTimeline({ data }: { data: SchedulePdfData }) {
  if (data.weeks.length === 0 || data.phases.length === 0) {
    return null;
  }

  return (
    <View style={schedulePdfStyles.timelineContainer} wrap={false}>
      <Text style={schedulePdfStyles.sectionTitle}>Production Timeline</Text>

      <View style={schedulePdfStyles.timelineWeekRow}>
        {data.weeks.map((week) => (
          <View
            key={`${week.startDate}-${week.endDate}`}
            style={[
              schedulePdfStyles.timelineWeekCell,
              { width: `${week.widthPercent}%` },
            ]}
          >
            <Text style={schedulePdfStyles.weekLabel}>{week.label}</Text>
            <Text style={schedulePdfStyles.weekDate}>{week.dateLabel}</Text>
          </View>
        ))}
      </View>

      {data.phases.map((phase) => (
        <View key={phase.id} style={schedulePdfStyles.phaseRow}>
          <Text style={schedulePdfStyles.phaseLabel}>{phase.name}</Text>
          <View style={schedulePdfStyles.phaseTrack}>
            <View
              style={[
                schedulePdfStyles.phaseBar,
                {
                  left: `${phase.leftPercent}%`,
                  width: `${Math.max(phase.widthPercent, 2)}%`,
                  backgroundColor: phase.color,
                },
              ]}
            >
              {phase.widthPercent > 6 ? (
                <Text style={schedulePdfStyles.phaseBarText}>
                  {phase.durationDays}d
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      ))}

      <View style={schedulePdfStyles.milestoneRow}>
        <Text style={schedulePdfStyles.phaseLabel}>Milestones</Text>
        <View style={schedulePdfStyles.milestoneTrack}>
          {data.milestones.map((milestone) => (
            <View
              key={milestone.id}
              style={[
                schedulePdfStyles.milestoneDiamond,
                {
                  left: `${milestone.leftPercent}%`,
                  backgroundColor: milestone.color,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={schedulePdfStyles.legendRow}>
        {Object.entries(MILESTONE_TYPE_LABELS).map(([type, label]) => {
          const sample = data.milestones.find((m) => m.type === type);
          if (!sample) return null;
          return (
            <View key={type} style={schedulePdfStyles.legendItem}>
              <View
                style={[
                  schedulePdfStyles.legendDiamond,
                  { backgroundColor: sample.color },
                ]}
              />
              <Text style={schedulePdfStyles.legendText}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function PdfScheduleDeliverables({ data }: { data: SchedulePdfData }) {
  if (data.deliverables.length === 0) return null;

  return (
    <View>
      <Text style={schedulePdfStyles.sectionTitle}>Deliverables</Text>
      {data.deliverables.map((item, index) => (
        <View key={`${item}-${index}`} style={schedulePdfStyles.deliverableItem}>
          <Text style={schedulePdfStyles.deliverableBullet}>•</Text>
          <Text style={schedulePdfStyles.deliverableText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function PdfScheduleNotes({ data }: { data: SchedulePdfData }) {
  if (!data.notes?.trim()) return null;

  return (
    <View style={schedulePdfStyles.notesBox}>
      <Text style={schedulePdfStyles.sectionTitle}>Notes</Text>
      <Text style={schedulePdfStyles.notesText}>{data.notes}</Text>
    </View>
  );
}

export function PdfScheduleFooter({ data }: { data: SchedulePdfData }) {
  return (
    <View style={schedulePdfStyles.footer} fixed>
      <Text style={schedulePdfStyles.footerText}>
        {data.brand.footerText ?? `${data.agencyName} · ${data.email}`}
      </Text>
      <Text style={schedulePdfStyles.footerText}>
        {data.projectTitle} · v{data.versionNumber}
      </Text>
      <Text
        style={schedulePdfStyles.footerText}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}
