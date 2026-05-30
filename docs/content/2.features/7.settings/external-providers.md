# External Providers

SparkyFitness supports integration with external health and fitness data providers to automatically sync your activity and measurements.

---

## Supported Providers

SparkyFitness supports integration with the following health and fitness data providers:

- Apple Health (iOS)
- Google Health Connect (Android)
- Fitbit
- Garmin Connect
- Withings
- Polar Flow (partially tested)
- Hevy (not tested)
- OpenFoodFacts
- USDA
- Fatsecret
- Nutritioninx
- Mealie
- Tandori
- Strava (partially tested)


---

## FatSecret: IP Whitelisting and Static-IP Proxies

FatSecret's API only accepts requests from **outbound IP addresses you have whitelisted** in their developer console. If the IP your SparkyFitness server makes requests from is not on the list, FatSecret returns error code `21` ("Invalid IP") and food search silently returns no results.

### Finding your server's outbound IP

Whitelist the IP your server connects *from* (its egress IP), not the IP your domain resolves to. From the server's shell:

```bash
curl https://api.ipify.org
```

Add that value under your app's **Allowed IP addresses** in the [FatSecret developer console](https://platform.fatsecret.com/).

### When your host has a dynamic egress IP

Some hosts (for example, Railway's Hobby plan) do not give you a stable outbound IP, so the whitelisted address goes stale on each redeploy and FatSecret breaks again. To fix this without changing hosts, route **only FatSecret traffic** through a static-IP forward proxy and whitelist the proxy's IP instead.

Set the proxy URL in your environment (see `docker/.env.example`):

```bash
FATSECRET_PROXY_URL=http://user:password@proxy.example.com:80
```

When set, SparkyFitness tunnels FatSecret's OAuth, search, nutrient, and barcode calls through the proxy. All other providers (OpenFoodFacts, USDA, Nutritionix, Mealie, Tandoor) continue to connect directly and are unaffected. Leave the variable unset to disable proxying.

### Managed static-IP proxy providers

If you don't run your own static-IP host, a managed proxy gives you stable IPs to whitelist:

| Provider | Notes |
| --- | --- |
| [QuotaGuard Static](https://www.quotaguard.com/) | **Recommended.** Publishes a small set of dedicated static IPs to whitelist, gives a ready-to-use HTTP proxy URL, and has a free trial tier. Designed for exactly this "whitelist my app's egress IP" use case. |
| [Fixie](https://usefixie.com/) | Similar HTTP proxy with static IPs and a free tier, but free-tier request limits are lower. |

**Recommendation:** Use **QuotaGuard Static**. Its dedicated static IPs and clear allow-list workflow map directly onto FatSecret's whitelisting model, and because SparkyFitness caches FatSecret responses for several minutes, request volume stays low enough for an entry-level plan.

**Setup steps:**

1. Sign up at QuotaGuard (or Fixie) and create a Static IP resource.
2. Copy the proxy URL it gives you (format `http://user:password@host:port`).
3. Copy the provider's published static IP(s) and add **all of them** to your FatSecret app's allowed IP list.
4. Set `FATSECRET_PROXY_URL` to the proxy URL and restart the server.
5. Verify: a FatSecret search should now return results. A `502` with FatSecret code `21` means the proxy IP still isn't whitelisted; an auth error means the FatSecret client credentials or scope are wrong.

---

## Contributing Mock Data

We are constantly working to improve these integrations. If you notice data missing or incorrect, you can help by providing anonymized mock data.

Join the **CodeWithCJ** community on [Discord](https://discord.gg/vcnMT5cPEA) and reach out if you'd like to share your mock data to help us improve the sync logic!
