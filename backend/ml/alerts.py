import resend
import os
from datetime import datetime

resend.api_key = os.getenv("RESEND_API_KEY")

def send_alert_email(
    portfolio_name: str,
    critical_companies: list,
    warning_companies: list,
    recipient_email: str,
):
    """Send email alert for critical portfolio companies"""

    if not critical_companies and not warning_companies:
        return {"success": False, "reason": "No alerts to send"}

    if not resend.api_key:
        return {"success": False, "reason": "No RESEND_API_KEY configured"}

    # build email HTML
    critical_rows = ""
    for company in critical_companies:
        alerts_html = "".join([
            f'<li style="color:#dc2626;margin:4px 0">{a["message"]}</li>'
            for a in company.get("alerts", [])
            if a["severity"] == "critical"
        ])
        critical_rows += f"""
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #fee2e2">
            <strong style="color:#111">{company["company_name"]}</strong>
            <div style="font-size:12px;color:#666;margin-top:2px">
              {company.get("sector","N/A")} · {company.get("stage","N/A")}
            </div>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #fee2e2">
            <span style="background:#fef2f2;color:#dc2626;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">
              DANGER
            </span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #fee2e2">
            <span style="font-weight:600;color:#dc2626">
              {company.get("latest_metrics",{}).get("runway_months","N/A")} months
            </span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #fee2e2">
            <ul style="margin:0;padding-left:16px;font-size:12px">
              {alerts_html}
            </ul>
          </td>
        </tr>
        """

    warning_rows = ""
    for company in warning_companies[:5]:
        warning_rows += f"""
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #fef3c7">
            <strong style="color:#111">{company["company_name"]}</strong>
          </td>
          <td style="padding:10px 16px;border-bottom:1px solid #fef3c7">
            <span style="background:#fffbeb;color:#d97706;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">
              WATCH
            </span>
          </td>
          <td style="padding:10px 16px;border-bottom:1px solid #fef3c7">
            {company.get("latest_metrics",{}).get("runway_months","N/A")} months
          </td>
          <td style="padding:10px 16px;border-bottom:1px solid #fef3c7">
            <span style="font-size:12px;color:#666">
              {company["alerts"][0]["message"] if company.get("alerts") else "Monitor closely"}
            </span>
          </td>
        </tr>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f8f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">

      <div style="max-width:680px;margin:0 auto;padding:32px 16px">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px 16px 0 0;padding:28px 32px">
          <div style="font-size:22px;font-weight:700;color:white">📡 PulseVC</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:4px">
            Portfolio Alert Report
          </div>
        </div>

        <!-- Body -->
        <div style="background:white;padding:32px;border:1px solid #e2e6f0;border-top:none">

          <h2 style="font-size:18px;font-weight:600;color:#111;margin:0 0 6px">
            {portfolio_name} — Action Required
          </h2>
          <p style="font-size:14px;color:#666;margin:0 0 24px">
            Generated {datetime.now().strftime("%B %d, %Y at %H:%M")} UTC
          </p>

          <!-- Summary badges -->
          <div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap">
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 20px;text-align:center;min-width:100px">
              <div style="font-size:24px;font-weight:700;color:#dc2626">{len(critical_companies)}</div>
              <div style="font-size:11px;color:#dc2626;font-weight:600;margin-top:2px">CRITICAL</div>
            </div>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 20px;text-align:center;min-width:100px">
              <div style="font-size:24px;font-weight:700;color:#d97706">{len(warning_companies)}</div>
              <div style="font-size:11px;color:#d97706;font-weight:600;margin-top:2px">WATCH</div>
            </div>
          </div>

          <!-- Critical companies -->
          {"<h3 style='font-size:15px;font-weight:600;color:#dc2626;margin:0 0 12px'>🚨 Critical Companies</h3>" if critical_companies else ""}
          {f"""
          <div style="border-radius:10px;overflow:hidden;border:1px solid #fee2e2;margin-bottom:24px">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#fef2f2">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#666;font-weight:600">COMPANY</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#666;font-weight:600">STATUS</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#666;font-weight:600">RUNWAY</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#666;font-weight:600">ALERTS</th>
                </tr>
              </thead>
              <tbody>{critical_rows}</tbody>
            </table>
          </div>
          """ if critical_companies else ""}

          <!-- Warning companies -->
          {"<h3 style='font-size:15px;font-weight:600;color:#d97706;margin:0 0 12px'>⚠️ Companies to Watch</h3>" if warning_companies else ""}
          {f"""
          <div style="border-radius:10px;overflow:hidden;border:1px solid #fde68a;margin-bottom:24px">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#fffbeb">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#666;font-weight:600">COMPANY</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#666;font-weight:600">STATUS</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#666;font-weight:600">RUNWAY</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#666;font-weight:600">DETAILS</th>
                </tr>
              </thead>
              <tbody>{warning_rows}</tbody>
            </table>
          </div>
          """ if warning_companies else ""}

          <!-- CTA -->
          <div style="text-align:center;margin-top:8px">
            <a href="https://pulsevc-frontend.onrender.com/dashboard"
               style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;box-shadow:0 2px 8px rgba(99,102,241,0.3)">
              View Full Analysis →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8f9fc;border:1px solid #e2e6f0;border-top:none;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center">
          <p style="font-size:12px;color:#9aa0b4;margin:0">
            PulseVC — AI-powered VC portfolio intelligence
          </p>
        </div>

      </div>
    </body>
    </html>
    """

    try:
        response = resend.Emails.send({
            "from": "PulseVC <onboarding@resend.dev>",
            "to": [recipient_email],
            "subject": f"🚨 PulseVC Alert: {len(critical_companies)} critical companies in {portfolio_name}",
            "html": html,
        })
        return {"success": True, "email_id": response.get("id")}
    except Exception as e:
        return {"success": False, "error": str(e)}