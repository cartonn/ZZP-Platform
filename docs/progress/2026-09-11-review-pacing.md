# Pace full-context review requests

PR1474 review run 34591000833 delivered all 62 source paths, but stopped before a final verdict when request five received HTTP429. The first four successful Responses requests sent 142,294, 154,920, 167,197 and 171,604 input tokens within 42 seconds. The account UI reports a 500,000-token/minute limit for the review model; billing credit remained available. No failed request was retried and the gate correctly published INCOMPLETE.

The trusted runner now leaves at least 61 seconds between successive POST starts. Time already spent generating a response or reading source counts toward that interval. The delay shares the existing 35-minute budget and abort signal; insufficient remaining time prevents a further POST. The endpoint, model, schema, permissions, final-verdict validation and no-retry behavior are unchanged. This reduces bursts within one review; it cannot guarantee capacity shared with other account traffic or solve daily/quota limits.

Validation: all 63 offline runner regressions passed, including pacing, insufficient time preventing another request, and long model calls requiring no extra delay. Existing HTTP429 and transport failures still issue no retry.
