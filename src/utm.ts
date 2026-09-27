export interface UtmInputs {
  /** Target destination URL */
  url: string;
  /** Referral source (e.g. meta, tiktok, klaviyo, google) */
  source?: string;
  /** Marketing medium (e.g. cpc, email, paid_social, bio) */
  medium?: string;
  /** Campaign name (e.g. spring_sale_2026) */
  campaign?: string;
  /** Ad set or creative content identifier (e.g. hook3_ugc_video) */
  content?: string;
  /** Target keyword or audience term */
  term?: string;
}

/**
 * Builds clean, normalized, error-free UTM tracking URLs for ad campaigns,
 * creator links, and email flows.
 */
export function buildUtmUrl(input: UtmInputs): string {
  const base = (input.url || '').trim();
  if (!base) return '';

  const parsed = new URL(base.startsWith('http://') || base.startsWith('https://') ? base : `https://${base}`);

  if (input.source?.trim()) parsed.searchParams.set('utm_source', input.source.trim().toLowerCase());
  if (input.medium?.trim()) parsed.searchParams.set('utm_medium', input.medium.trim().toLowerCase());
  if (input.campaign?.trim()) parsed.searchParams.set('utm_campaign', input.campaign.trim().toLowerCase());
  if (input.content?.trim()) parsed.searchParams.set('utm_content', input.content.trim().toLowerCase());
  if (input.term?.trim()) parsed.searchParams.set('utm_term', input.term.trim().toLowerCase());

  return parsed.toString();
}
