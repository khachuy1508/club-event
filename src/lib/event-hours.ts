import { prisma } from "@/lib/prisma";

export const EVENT_SETTINGS_ID = "default";
export const OUTSIDE_EVENT_HOURS_MESSAGE = "Hiện không trong khung giờ event";

const VN_TZ = "Asia/Ho_Chi_Minh";

export type EventHoursSettings = {
  morningName: string;
  morningStart: string;
  morningEnd: string;
  afternoonName: string;
  afternoonStart: string;
  afternoonEnd: string;
};

export type EventSlot = {
  name: string;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseHm(value: string): number | null {
  const match = TIME_RE.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function nowInVietnam(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function slotsFromSettings(settings: EventHoursSettings): EventSlot[] | null {
  const morningStart = parseHm(settings.morningStart);
  const morningEnd = parseHm(settings.morningEnd);
  const afternoonStart = parseHm(settings.afternoonStart);
  const afternoonEnd = parseHm(settings.afternoonEnd);
  if (
    morningStart === null ||
    morningEnd === null ||
    afternoonStart === null ||
    afternoonEnd === null
  ) {
    return null;
  }
  return [
    {
      name: settings.morningName,
      start: settings.morningStart,
      end: settings.morningEnd,
      startMinutes: morningStart,
      endMinutes: morningEnd,
    },
    {
      name: settings.afternoonName,
      start: settings.afternoonStart,
      end: settings.afternoonEnd,
      startMinutes: afternoonStart,
      endMinutes: afternoonEnd,
    },
  ];
}

export function currentSlot(
  settings: EventHoursSettings,
  now = nowInVietnam(),
): EventSlot | null {
  const slots = slotsFromSettings(settings);
  if (!slots) return null;
  return (
    slots.find(
      (slot) => now.minutes >= slot.startMinutes && now.minutes <= slot.endMinutes,
    ) ?? null
  );
}

export async function getEventHoursSettings(): Promise<EventHoursSettings | null> {
  const row = await prisma.eventSettings.findUnique({
    where: { id: EVENT_SETTINGS_ID },
  });
  if (!row) return null;
  return {
    morningName: row.morningName,
    morningStart: row.morningStart,
    morningEnd: row.morningEnd,
    afternoonName: row.afternoonName,
    afternoonStart: row.afternoonStart,
    afternoonEnd: row.afternoonEnd,
  };
}

export async function assertCheckInAllowed(): Promise<
  { ok: true; slotName: string | null } | { ok: false; message: string }
> {
  const settings = await getEventHoursSettings();
  if (!settings) {
    return { ok: true, slotName: null };
  }
  const slot = currentSlot(settings);
  if (!slot) {
    return { ok: false, message: OUTSIDE_EVENT_HOURS_MESSAGE };
  }
  return { ok: true, slotName: slot.name };
}
