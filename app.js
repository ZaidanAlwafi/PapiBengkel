'use strict';

const services = [
  { id: 'berkala', name: 'Paket Servis Berkala 10.000–20.000 KM', price: 550000, minutes: 90, description: 'Pemeriksaan kendaraan, pembersihan filter udara dan AC, rotasi ban, serta penyetelan rem.' },
  { id: 'oli', name: 'Ganti Oli Mesin Fastron / Shell Helix + Filter', price: 385000, minutes: 45, description: 'Penggantian 4 liter oli mesin sintetis sekaligus filter oli.' },
  { id: 'rem', name: 'Paket Servis Rem & Bubut Piringan Cakram', price: 280000, minutes: 60, description: 'Pembersihan kaliper, penggantian minyak rem, dan perataan piringan cakram.' },
  { id: 'tune-up', name: 'Tune-up Komprehensif & Scanner OBD2', price: 420000, minutes: 75, description: 'Pemindaian kelistrikan, pembersihan injektor, dan penyetelan celah busi.' },
  { id: 'aki', name: 'Ganti Aki GS Astra MF', price: 850000, minutes: 30, description: 'Penggantian aki bebas perawatan dan pemeriksaan tegangan alternator.' },
];

const exampleVehicle = { name: 'Toyota Avanza Veloz', type: 'Mobil', year: 2020, plate: 'B 1234 XYZ', details: 'Otomatis · Odometer 24.350 km' };
const stages = ['Pilih Layanan', 'Info Kendaraan', 'Pilih Jadwal', 'Review', 'Konfirmasi'];
const slotGroups = [
  { name: 'Sesi pagi (08.00–12.00 WIB)', times: ['08:30', '09:30', '10:30', '11:30'] },
  { name: 'Sesi siang (13.00–17.00 WIB)', times: ['13:00', '14:00', '15:30', '16:15'] },
];
const timeOptions = slotGroups.flatMap(group => group.times);
const storageKey = 'papibengkel-stitch-bookings-v1';
const timeZone = 'Asia/Jakarta';
const number = new Intl.NumberFormat('id-ID');
const dayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone });
const monthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone });
const dateFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone });
const dateKeyFormatter = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeZone });
const clockIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

const byId = id => document.getElementById(id);
const text = (id, value) => { byId(id).textContent = value; };
const money = amount => `Rp ${number.format(amount)}`;
const timeMinutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const todayKey = () => dateKeyFormatter.format(new Date());

function nextDates() {
  const date = new Date(`${todayKey()}T12:00:00+07:00`);
  const days = [];
  while (days.length < 5) {
    if (dayFormatter.format(date) !== 'Minggu') days.push({ id: dateKeyFormatter.format(date), date: new Date(date) });
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
}

const form = byId('booking');
const vehicleFields = byId('new-vehicle');
const notes = byId('mechanic-notes');
const dates = nextDates();
const selected = new Set(['berkala', 'oli']);
const state = { stage: 1, date: dates[0].id, time: '', confirmed: null };

function duration(minutes) {
  if (!minutes) return '—';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours && `${hours} jam`, remainder && `${remainder} menit`].filter(Boolean).join(' ');
}

function readBookings() {
  try {
    const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(records) ? records.filter(record => record?.id && record.date && record.time && record.vehicle?.name && Array.isArray(record.services)) : [];
  } catch {
    return [];
  }
}

function selectedServices() {
  return services.filter(service => selected.has(service.id));
}

function vehicleData() {
  if (vehicleFields.disabled) return exampleVehicle;
  const fields = form.elements;
  const brand = fields.brand.value.trim();
  const model = fields.model.value.trim();
  return { name: [brand, model].filter(Boolean).join(' '), type: fields.vehicleType.value, year: Number(fields.year.value), plate: fields.plate.value.trim().replace(/\s+/g, ' ').toUpperCase(), details: fields.vehicleType.value };
}

function slotIsAvailable(date, time, minutes, bookings) {
  const start = timeMinutes(time);
  const end = start + Math.max(30, minutes);
  const dateNumber = Number(date.slice(-2));
  if (time === '11:30' || end > 17 * 60 || (dateNumber % 3 === 0 && time === '08:30')) return false;
  if (new Date(`${date}T${time}:00+07:00`) <= new Date()) return false;
  return !bookings.some(booking => {
    if (booking.date !== date) return false;
    const otherStart = timeMinutes(booking.time);
    return start < otherStart + Number(booking.minutes) && end > otherStart;
  });
}

function scheduleLabel(date, time, full = true) {
  if (!date || !time) return 'Belum dipilih';
  const value = new Date(`${date}T12:00:00+07:00`);
  return `${full ? dateFormatter.format(value) : dayFormatter.format(value)} · ${time} WIB`;
}

function drawServices() {
  byId('service-list').innerHTML = services.map(({ id, name, price, minutes, description }) => `
    <label class="service-row">
      <input type="checkbox" name="services" value="${id}" ${selected.has(id) ? 'checked' : ''}>
      <span><span class="service-head"><strong>${name}</strong><strong class="service-price">${money(price)}</strong></span>
      <span class="service-description">${description}</span><span class="service-time">${clockIcon} ${minutes} menit</span></span>
    </label>`).join('');
}

function drawProgress() {
  for (const [index, title] of stages.entries()) {
    const step = index + 1;
    const button = byId(`step-${step}`);
    const complete = step < state.stage;
    button.classList.toggle('is-complete', complete);
    button.firstElementChild.textContent = complete ? '✓' : step;
    button.disabled = state.confirmed ? step !== 5 : step === 5;
    if (step === state.stage) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
    document.querySelector(`[data-section="${step}"]`).classList.toggle('is-active', step === state.stage);
  }
}

function drawSchedule(focus = '') {
  const minutes = selectedServices().reduce((total, service) => total + service.minutes, 0);
  const bookings = readBookings();
  const available = (date, time) => slotIsAvailable(date, time, minutes, bookings);
  if (!timeOptions.some(time => available(state.date, time))) {
    state.date = dates.find(day => timeOptions.some(time => available(day.id, time)))?.id ?? state.date;
  }
  if (state.time && !available(state.date, state.time)) state.time = '';
  const activeDate = dates.find(day => day.id === state.date);
  text('month-label', monthFormatter.format(activeDate.date));
  byId('dates').innerHTML = dates.map(({ id, date }) => {
    const open = timeOptions.filter(time => available(id, time)).length;
    return `<button type="button" class="date" data-date="${id}" aria-label="${dateFormatter.format(date)}, ${open} slot" aria-pressed="${id === state.date}" ${open ? '' : 'disabled'}><span>${dayFormatter.format(date)}</span><strong>${Number(id.slice(-2))}</strong><small>${open ? `${open} slot` : 'Penuh'}</small></button>`;
  }).join('');
  byId('times').innerHTML = slotGroups.map(({ name, times }) => `<div class="time-group"><h3>${name}</h3><div class="time-grid">${times.map(time => `<button type="button" class="time" data-time="${time}" aria-pressed="${time === state.time}" ${available(state.date, time) ? '' : 'disabled'}>${time} WIB</button>`).join('')}</div></div>`).join('');
  if (focus === 'date') byId('dates').querySelector('[aria-pressed="true"]:enabled')?.focus();
  if (focus === 'time') byId('times').querySelector('[aria-pressed="true"]:enabled')?.focus();
}

function drawLineItems(container, items, showDuration = false) {
  container.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'Belum ada layanan terpilih.';
    container.append(empty);
  }
  for (const item of items) {
    const row = document.createElement('li');
    const label = document.createElement('span');
    const price = document.createElement('strong');
    label.textContent = item.name;
    price.textContent = money(item.price);
    if (showDuration) {
      const estimate = document.createElement('small');
      estimate.textContent = `Est. ${item.minutes} menit`;
      label.append(estimate);
    }
    row.append(label, price);
    container.append(row);
  }
}

function drawSummary(announce = false) {
  const items = selectedServices();
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const minutes = items.reduce((sum, item) => sum + item.minutes, 0);
  const vehicle = vehicleData();
  const schedule = scheduleLabel(state.date, state.time);
  text('selection-count', `${items.length} terpilih`);
  text('notes-count', `${notes.value.length}/300`);
  drawLineItems(byId('summary-services'), items, true);
  drawLineItems(byId('review-services'), items);
  text('summary-schedule', scheduleLabel(state.date, state.time, false));
  text('summary-vehicle', vehicle.name ? `${vehicle.name}${vehicle.plate ? ` (${vehicle.plate})` : ''}` : 'Belum diisi');
  text('summary-duration', duration(minutes));
  text('subtotal', money(subtotal));
  text('summary-total', money(subtotal));
  text('review-schedule', schedule);
  text('review-duration', `Estimasi durasi ${duration(minutes)}`);
  text('review-vehicle', vehicle.name ? `${vehicle.name}${vehicle.year ? ` (${vehicle.year})` : ''}` : 'Belum diisi');
  text('review-vehicle-details', vehicle.details);
  text('review-plate', vehicle.plate || '—');
  text('review-service-title', `Rincian layanan (${items.length})`);
  const reviewNotes = byId('review-notes');
  reviewNotes.hidden = !notes.value.trim();
  reviewNotes.textContent = `Catatan teknisi: ${notes.value.trim()}`;
  text('review-total', money(subtotal));
  if (announce) text('total-announcement', `Total estimasi ${money(subtotal)}.`);
}

function changeStage(stage, focus = true) {
  if (state.confirmed && stage !== 5) return;
  state.stage = stage;
  drawProgress();
  if (!focus) return;
  const panel = document.querySelector(`[data-section="${stage}"]`);
  panel.scrollIntoView({ block: 'start' });
  panel.querySelector('h2').focus({ preventScroll: true });
}

function showError(id, message) {
  text(id, message);
  byId(id).hidden = !message;
}

function bookingIsValid() {
  showError('booking-error', '');
  showError('services-error', '');
  showError('vehicle-error', '');
  showError('schedule-error', '');
  if (!selected.size) {
    changeStage(1);
    showError('services-error', 'Pilih minimal satu layanan servis.');
    byId('service-list').querySelector('input').focus();
    return false;
  }
  if (!vehicleFields.disabled) {
    const field = [...vehicleFields.querySelectorAll('input')].find(input => !input.value.trim() || !input.validity.valid);
    if (field) {
      changeStage(2);
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', 'vehicle-error');
      showError('vehicle-error', field.name === 'year' ? `Isi tahun 1900–${field.max}.` : 'Lengkapi kolom data kendaraan ini.');
      field.focus();
      return false;
    }
  }
  const minutes = selectedServices().reduce((sum, service) => sum + service.minutes, 0);
  if (!state.time || !slotIsAvailable(state.date, state.time, minutes, readBookings())) {
    drawSchedule();
    drawSummary();
    changeStage(3);
    showError('schedule-error', 'Pilih jam kedatangan yang masih tersedia.');
    const firstTime = byId('times').querySelector('button:enabled');
    if (firstTime) {
      firstTime.setAttribute('aria-describedby', 'schedule-error');
      firstTime.focus();
    }
    return false;
  }
  return true;
}

function drawTicket(container, booking) {
  container.replaceChildren();
  const title = document.createElement('h3');
  title.textContent = booking.id;
  const schedule = document.createElement('p');
  schedule.textContent = scheduleLabel(booking.date, booking.time);
  const vehicle = document.createElement('p');
  vehicle.textContent = `${booking.vehicle.name} · ${booking.vehicle.plate}`;
  const items = document.createElement('ul');
  items.className = 'line-items';
  drawLineItems(items, booking.services);
  const total = document.createElement('strong');
  total.textContent = `Total estimasi ${money(booking.total)}`;
  container.append(title, schedule, vehicle, items, total);
  if (booking.notes) {
    const note = document.createElement('p');
    note.textContent = `Catatan: ${booking.notes}`;
    container.append(note);
  }
}

function drawOrders() {
  const list = byId('orders-list');
  list.replaceChildren();
  const bookings = readBookings();
  if (!bookings.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Belum ada booking demo. Selesaikan reservasi untuk melihatnya di sini.';
    list.append(empty);
  }
  for (const booking of bookings) {
    const item = document.createElement('article');
    item.className = 'order-item';
    drawTicket(item, booking);
    list.append(item);
  }
}

function submitBooking(event) {
  event.preventDefault();
  if (state.confirmed || !bookingIsValid()) return;
  const items = selectedServices();
  const booking = {
    id: `PB-${state.date.replaceAll('-', '')}-${Date.now().toString(36).slice(-8).toUpperCase()}`,
    date: state.date,
    time: state.time,
    vehicle: vehicleData(),
    services: items,
    minutes: items.reduce((sum, item) => sum + item.minutes, 0),
    total: items.reduce((sum, item) => sum + item.price, 0),
    notes: notes.value.trim(),
  };
  try {
    localStorage.setItem(storageKey, JSON.stringify([booking, ...readBookings()]));
  } catch {
    showError('booking-error', 'Penyimpanan browser tidak tersedia. Izinkan penyimpanan, lalu coba lagi.');
    return;
  }
  state.confirmed = booking;
  for (const panel of form.querySelectorAll('.stage')) panel.hidden = panel.id !== 'konfirmasi';
  byId('summary').hidden = true;
  drawTicket(byId('ticket'), booking);
  changeStage(5);
}

function resetBooking() {
  form.reset();
  selected.clear();
  selected.add('berkala');
  selected.add('oli');
  state.confirmed = null;
  state.date = dates[0].id;
  state.time = '';
  vehicleFields.hidden = true;
  vehicleFields.disabled = true;
  byId('saved-vehicle').hidden = false;
  for (const panel of form.querySelectorAll('.stage')) panel.hidden = panel.id === 'konfirmasi';
  byId('summary').hidden = false;
  drawServices();
  drawSchedule();
  drawSummary();
  changeStage(1);
}

byId('steps').innerHTML = stages.map((title, index) => `<li><button id="step-${index + 1}" type="button" class="step-button" data-stage="${index + 1}"><span class="number" aria-hidden="true"></span><span><small>Langkah ${index + 1}</small><strong>${title}</strong></span></button></li>`).join('');
form.elements.year.max = todayKey().slice(0, 4);

document.addEventListener('click', event => {
  const action = event.target.closest('[data-stage], [data-dialog], [data-date], [data-time]');
  if (!action) return;
  if (action.dataset.stage) {
    event.preventDefault();
    if (state.confirmed && action.tagName === 'A') return resetBooking();
    const stage = Number(action.dataset.stage);
    if (stage !== 4 || bookingIsValid()) changeStage(stage);
  } else if (action.dataset.dialog) {
    if (action.dataset.dialog === 'orders-dialog') drawOrders();
    byId(action.dataset.dialog).showModal();
  } else if (action.dataset.date) {
    if (state.date !== action.dataset.date) state.time = '';
    state.date = action.dataset.date;
    showError('schedule-error', '');
    drawSchedule('date');
    drawSummary();
  } else {
    state.time = action.dataset.time;
    showError('schedule-error', '');
    drawSchedule('time');
    drawSummary();
  }
});

byId('service-list').addEventListener('change', event => {
  const input = event.target;
  if (input.checked) selected.add(input.value);
  else selected.delete(input.value);
  showError('services-error', '');
  drawSchedule();
  drawSummary(true);
});

form.addEventListener('input', event => {
  const input = event.target;
  if (input.name === 'vehicleMode') {
    vehicleFields.disabled = input.value === 'saved';
    vehicleFields.hidden = vehicleFields.disabled;
    byId('saved-vehicle').hidden = !vehicleFields.disabled;
    showError('vehicle-error', '');
  }
  if (vehicleFields.contains(input) && input.hasAttribute('aria-invalid')) {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    showError('vehicle-error', '');
  }
  if (input.name !== 'services') drawSummary();
});

byId('review-button').addEventListener('click', () => { if (bookingIsValid()) changeStage(4); });
form.addEventListener('submit', submitBooking);
byId('new-booking').addEventListener('click', resetBooking);
window.addEventListener('storage', event => {
  if (event.key !== storageKey) return;
  if (!state.confirmed) { drawSchedule(); drawSummary(); }
  if (byId('orders-dialog').open) drawOrders();
});

drawServices();
drawProgress();
drawSchedule();
drawSummary();
