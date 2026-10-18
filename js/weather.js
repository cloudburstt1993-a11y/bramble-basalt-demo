/* Bramble & Basalt demo: today's yard tip from the live National Weather Service
   forecast for Grand Junction (public data, no account or key). Hidden if offline. */
(() => {
  'use strict';
  const { $, icon, track } = window.BB;
  const box = $('#wx');
  if (!box) return;
  const ctl = new AbortController();
  setTimeout(() => ctl.abort(), 7000);
  const get = u => fetch(u, { signal: ctl.signal, headers: { Accept: 'application/geo+json' } }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  get('https://api.weather.gov/points/39.0639,-108.5506')
    .then(p => get(p.properties.forecast))
    .then(f => {
      const ps = f.properties.periods.slice(0, 4);
      const rain = ps.slice(0, 2).some(x => (x.probabilityOfPrecipitation?.value || 0) >= 40);
      const night = ps.find(x => !x.isDaytime), day = ps.find(x => x.isDaytime);
      let tip, ic = 'sun';
      if (rain) { tip = 'Rain is likely. Skip watering today and let the sky do it.'; ic = 'droplet'; }
      else if (night && night.temperature <= 32) { tip = `Freeze tonight (${night.temperature}°). Bring pots in and book your sprinkler blowout.`; ic = 'snowflake'; }
      else if (day && day.temperature >= 90) { tip = `Hot one (${day.temperature}°). Water before 8 am so less evaporates.`; }
      else { tip = 'Mild and dry: a great day to plant. Soak new plantings deeply.'; ic = 'sprout'; }
      box.innerHTML = `
        <div class="flex items-start gap-4">
          <span class="grid size-12 shrink-0 place-items-center rounded-full bg-white/10 text-sun-300">${icon(ic)}</span>
          <div><p class="text-xs font-semibold uppercase tracking-wider text-sun-300">Today's yard tip · Grand Junction</p><p class="mt-1 text-lg font-semibold text-white">${tip}</p></div>
        </div>
        <ul class="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">${ps.map(x => `<li class="rounded-xl bg-white/5 p-3"><b class="block text-white">${x.name}</b>${x.temperature}° · ${x.shortForecast}</li>`).join('')}</ul>
        <p class="mt-3 text-xs text-basalt-200">Live forecast from the National Weather Service. Updates every visit.</p>`;
      box.hidden = false;
      track('weather_tip_shown', { tip: ic });
    })
    .catch(() => { /* offline or NWS down: the widget simply stays hidden */ });
})();
