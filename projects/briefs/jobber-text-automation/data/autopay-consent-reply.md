# Autopay consent reply — send when a client replies AUTOPAY

A reply of AUTOPAY is interest, not consent. Do not switch autopay on until the client answers
YES to the message below (brief, Lane 3: amount, frequency, recurs, start, how to cancel).

## Card on file

> Thanks {first}! Here's how it works: we'll charge the card on file {amount} on the 1st of each
> month for your Total Mole Control Program, starting {month}. It continues each month until you
> tell us to stop — just text or call 253-300-0889 anytime, no fee. You'll get a receipt by email
> with every charge. Reply YES to set it up.

## No card on file

> Thanks {first}! Here's how it works: we'll charge your card {amount} on the 1st of each month
> for your Total Mole Control Program, starting {month}. It continues each month until you tell
> us to stop — just text or call 253-300-0889 anytime, no fee. You'll get a receipt by email with
> every charge. Reply YES and we'll send a secure link to add your card.

## After YES

1. Toggle *Automatic payments* on the client's TMCP job in Jobber (UI only — no API mutation).
2. Note on the client: "Autopay consent by text YES {date}" — the thread is the audit record.
3. Confirm: "You're all set — autopay starts {month}. Thanks!"
4. Separately, they still owe the past-due invoice — run it with CHARGE consent or the pay link.
