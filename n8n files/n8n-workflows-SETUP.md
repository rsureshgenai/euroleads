# EuroLeads n8n Workflows — Setup Guide

Two workflow files are included:

1. `euroleads-send-email-smtp.json` — sends a templated email + brochure to a lead when you click "Email" in the app. Uses raw SMTP (matches your existing Gmail App Password setup from the SIS blog automation).
2. `euroleads-reply-detection.json` — watches your Gmail inbox and notifies EuroLeads when a lead replies, so the lead's stage auto-updates to "Replied".

There's also `euroleads-send-email-oauth.json` — same workflow but using n8n's Gmail OAuth2 node instead of SMTP. Only use this one if you'd rather connect via Google OAuth than an App Password. Most people should use the SMTP version since it matches your existing setup.

## How to import

1. Open your Hostinger n8n dashboard.
2. Click "+ New Workflow" then the three-dot menu (top right) → "Import from File" (or paste the JSON via "Import from URL/Clipboard" if your version offers that).
3. Select `euroleads-send-email-smtp.json`.
4. Repeat for `euroleads-reply-detection.json` as a separate workflow.

## Required edits after importing

### In `euroleads-send-email-smtp.json`:

- Both "Send Email" nodes have `fromEmail` set to `YOUR_SENDING_EMAIL@gmail.com` — replace with your actual Gmail address.
- Both "Send Email" nodes reference an SMTP credential with id `REPLACE_WITH_YOUR_SMTP_CREDENTIAL_ID`. In n8n, click each "Send Email" node, and under Credentials, either select your existing Gmail SMTP credential (the one used for SIS blog automation) or create a new one with:
  - Host: `smtp.gmail.com`
  - Port: `465`
  - User: your Gmail address
  - Password: your Gmail App Password (not your regular Gmail password)
  - SSL: enabled

### In `euroleads-reply-detection.json`:

- The "Notify EuroLeads" node has `url` set to `https://YOUR-EUROLEADS-DOMAIN.vercel.app/api/webhook/reply` — replace with your actual deployed app URL once EuroLeads is live on Vercel (or your `localhost` ngrok tunnel if testing locally).
- Replace `REPLACE_WITH_YOUR_WEBHOOK_SHARED_SECRET` with the exact value you set as `WEBHOOK_SHARED_SECRET` in your EuroLeads `.env.local`.
- The "Gmail Trigger" node needs a Gmail OAuth2 credential connected (click the node → Credentials → connect your Gmail account). This is separate from SMTP — Gmail Trigger requires OAuth2, it can't use a plain SMTP credential.

## After importing

1. Activate both workflows (toggle in the top right of each workflow).
2. Copy the Webhook URL from the "Webhook" node in `euroleads-send-email-smtp.json` (click the node, copy the "Production URL").
3. Put that URL into your EuroLeads `.env.local` as:
   ```
   N8N_SEND_EMAIL_WEBHOOK_URL=<paste the webhook URL here>
   ```
4. Restart your EuroLeads dev server so it picks up the new env var.
5. Test by clicking "Send email with brochure" on a lead in the app — check the n8n workflow's execution log to see if it ran successfully, and check the lead's inbox.

## Notes

- The send-email workflow checks if `brochureUrl` is present. If yes, it downloads the PDF from Supabase Storage and attaches it. If no brochure is uploaded yet in Settings, it sends the email without an attachment.
- The reply-detection workflow polls Gmail every minute for unread messages. This means there can be up to a 1-minute delay between a lead replying and the stage updating in EuroLeads — this is normal n8n polling behavior, not a bug.
- Make sure the email address leads reply to is the same Gmail account connected to the Gmail Trigger node, otherwise replies won't be detected.
