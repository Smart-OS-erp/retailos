# Vercel Security

## Controls

- Require least-privileged team access, MFA-capable identity, and reviewed repository/project linkage.
- Separate preview and production secrets and data; preview deployments are untrusted public surfaces unless access protection is verified.
- Prevent secret exposure through public variables, build logs, source maps, artifacts, and error pages.
- Define security headers: CSP based on actual dependencies, HSTS in production, content-type protection, referrer policy, permissions policy, and framing controls.
- Protect production domains and deployment promotion; review custom-domain and DNS ownership.
- Set function duration/body limits, rate controls, and safe failure behavior.
- Use deployment logs, firewall/platform controls, and alerts appropriate to risk.
- Retain an application rollback path and ensure database changes remain backward compatible during rollback.

Before production, verify controls against the deployed response and account settings; configuration documentation alone is insufficient evidence.
