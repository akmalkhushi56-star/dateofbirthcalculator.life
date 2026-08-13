// Calc: shared pure calculation functions used by every tool page.
// No dependencies, no network calls, everything runs in the browser.
var Calc = (function () {
  'use strict';

  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var CN_ZODIAC = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  var GENERATIONS = [
    { name: 'Lost Generation', from: 1883, to: 1900 },
    { name: 'Greatest Generation', from: 1901, to: 1927 },
    { name: 'Silent Generation', from: 1928, to: 1945 },
    { name: 'Baby Boomer', from: 1946, to: 1964 },
    { name: 'Generation X', from: 1965, to: 1980 },
    { name: 'Millennial (Gen Y)', from: 1981, to: 1996 },
    { name: 'Generation Z', from: 1997, to: 2012 },
    { name: 'Generation Alpha', from: 2013, to: 2029 }
  ];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // Parse a "YYYY-MM-DD" string (from <input type=date>) into a Date fixed at
  // local noon, which sidesteps timezone/DST rollover bugs entirely.
  function parseDateInput(str) {
    if (!str) return null;
    var parts = str.split('-');
    if (parts.length !== 3) return null;
    var y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
    if (!y || !m || !d) return null;
    var dt = new Date(y, m - 1, d, 12, 0, 0);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null; // invalid date e.g. Feb 30
    return dt;
  }

  function todayNoon() {
    var t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0);
  }

  function isLeapYear(y) {
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  }

  function daysInMonth(year, month /* 0-11 */) {
    return new Date(year, month + 1, 0).getDate();
  }

  // Calendar-accurate years/months/days between two dates (d2 must be >= d1).
  function diffYMD(d1, d2) {
    var y = d2.getFullYear() - d1.getFullYear();
    var m = d2.getMonth() - d1.getMonth();
    var d = d2.getDate() - d1.getDate();
    if (d < 0) {
      m -= 1;
      var prevMonthDate = new Date(d2.getFullYear(), d2.getMonth(), 0).getDate();
      d += prevMonthDate;
    }
    if (m < 0) {
      y -= 1;
      m += 12;
    }
    return { years: y, months: m, days: d };
  }

  function totalDaysBetween(d1, d2) {
    return Math.round((d2.getTime() - d1.getTime()) / 86400000);
  }

  function nextBirthdayFrom(dob, ref) {
    var refDateOnly = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    var bMonth = dob.getMonth(), bDay = dob.getDate();
    if (bMonth === 1 && bDay === 29 && !isLeapYear(ref.getFullYear())) {
      bDay = 28; // observe Feb 28 in non-leap years
    }
    var next = new Date(ref.getFullYear(), bMonth, bDay);
    if (next.getTime() < refDateOnly.getTime()) {
      var y2 = ref.getFullYear() + 1;
      var day2 = dob.getDate();
      if (dob.getMonth() === 1 && day2 === 29 && !isLeapYear(y2)) day2 = 28;
      next = new Date(y2, dob.getMonth(), day2);
    }
    var daysUntil = Math.round((next.getTime() - refDateOnly.getTime()) / 86400000);
    return { date: next, daysUntil: daysUntil };
  }

  // Full age breakdown used across most calculator pages.
  function ageBreakdown(dob, ref) {
    ref = ref || todayNoon();
    if (dob.getTime() > ref.getTime()) {
      return null; // birth date is in the future
    }
    var ymd = diffYMD(dob, ref);
    var totalDays = totalDaysBetween(dob, ref);
    var totalWeeks = Math.floor(totalDays / 7);
    var totalMonths = ymd.years * 12 + ymd.months;
    var totalHours = totalDays * 24;
    var nb = nextBirthdayFrom(dob, ref);
    return {
      years: ymd.years,
      months: ymd.months,
      days: ymd.days,
      totalDays: totalDays,
      totalWeeks: totalWeeks,
      totalMonths: totalMonths,
      totalHours: totalHours,
      nextBirthday: nb,
      dayOfWeekBorn: WEEKDAYS[dob.getDay()],
      zodiac: westernZodiac(dob.getMonth() + 1, dob.getDate()),
      chineseZodiac: chineseZodiac(dob.getFullYear()),
      generation: generationFor(dob.getFullYear())
    };
  }

  function westernZodiac(month, day) {
    var z = [
      ['Capricorn', 1, 19], ['Aquarius', 2, 18], ['Pisces', 3, 20], ['Aries', 4, 19],
      ['Taurus', 5, 20], ['Gemini', 6, 20], ['Cancer', 7, 22], ['Leo', 8, 22],
      ['Virgo', 9, 22], ['Libra', 10, 22], ['Scorpio', 11, 21], ['Sagittarius', 12, 21], ['Capricorn', 12, 31]
    ];
    if (month === 1 && day <= 19) return 'Capricorn';
    for (var i = 0; i < z.length; i++) {
      if (month === z[i][1] && day <= z[i][2]) return z[i][0];
    }
    // fallback: after the cutoff day, sign advances to the next entry
    var order = ['Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'];
    var idx = month - 1;
    return order[(idx + 1) % 12] === order[idx] ? order[idx] : nextSignAfter(month);
  }
  function nextSignAfter(month) {
    var map = { 1: 'Aquarius', 2: 'Pisces', 3: 'Aries', 4: 'Taurus', 5: 'Gemini', 6: 'Cancer', 7: 'Leo', 8: 'Virgo', 9: 'Libra', 10: 'Scorpio', 11: 'Sagittarius', 12: 'Capricorn' };
    return map[month];
  }

  function chineseZodiac(year) {
    var idx = ((year - 1900) % 12 + 12) % 12;
    return CN_ZODIAC[idx];
  }

  function generationFor(year) {
    for (var i = 0; i < GENERATIONS.length; i++) {
      if (year >= GENERATIONS[i].from && year <= GENERATIONS[i].to) return GENERATIONS[i].name;
    }
    return year < 1883 ? 'Historic' : 'Generation Beta';
  }

  // Difference between two people's ages (age gap), given both dates of birth.
  function ageDifference(dobA, dobB) {
    var early = dobA.getTime() <= dobB.getTime() ? dobA : dobB;
    var late = dobA.getTime() <= dobB.getTime() ? dobB : dobA;
    var ymd = diffYMD(early, late);
    var totalDays = totalDaysBetween(early, late);
    return { years: ymd.years, months: ymd.months, days: ymd.days, totalDays: totalDays, olderIsA: dobA.getTime() < dobB.getTime() };
  }

  // Simplified life path number (numerology), reduced to a single digit
  // unless a master number (11, 22, 33) appears.
  function reduceNumerology(n) {
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = String(n).split('').reduce(function (a, c) { return a + parseInt(c, 10); }, 0);
    }
    return n;
  }
  function lifePathNumber(year, month, day) {
    var digits = ('' + year + pad(month) + pad(day)).split('').map(Number);
    var sum = digits.reduce(function (a, b) { return a + b; }, 0);
    return reduceNumerology(sum);
  }
  function nameNumerology(name) {
    var map = { a:1,j:1,s:1, b:2,k:2,t:2, c:3,l:3,u:3, d:4,m:4,v:4, e:5,n:5,w:5, f:6,o:6,x:6, g:7,p:7,y:7, h:8,q:8,z:8, i:9,r:9 };
    var clean = (name || '').toLowerCase().replace(/[^a-z]/g, '');
    var sum = 0;
    for (var i = 0; i < clean.length; i++) sum += map[clean[i]] || 0;
    return reduceNumerology(sum || 0);
  }

  // Deterministic "love score" for entertainment purposes only.
  function loveScore(nameA, nameB, dobAstr, dobBstr) {
    var s = ((nameA || '') + (nameB || '') + (dobAstr || '') + (dobBstr || '')).toLowerCase().replace(/[^a-z0-9]/g, '');
    var hash = 0;
    for (var i = 0; i < s.length; i++) {
      hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    }
    if (s.length === 0) hash = 42;
    return 35 + (hash % 61); // 35-95, keeps results upbeat like the genre expects
  }

  // US Social Security full retirement age table.
  function fullRetirementAge(birthYear) {
    if (birthYear <= 1937) return { years: 65, months: 0 };
    if (birthYear <= 1942) return { years: 65, months: (birthYear - 1937) * 2 };
    if (birthYear <= 1954) return { years: 66, months: 0 };
    if (birthYear <= 1959) return { years: 66, months: (birthYear - 1954) * 2 };
    return { years: 67, months: 0 };
  }
  function retirementDate(dob) {
    var fra = fullRetirementAge(dob.getFullYear());
    var d = new Date(dob.getFullYear() + fra.years, dob.getMonth() + fra.months, dob.getDate());
    return { date: d, fra: fra };
  }

  return {
    WEEKDAYS: WEEKDAYS, MONTHS: MONTHS, GENERATIONS: GENERATIONS,
    parseDateInput: parseDateInput, todayNoon: todayNoon, isLeapYear: isLeapYear, daysInMonth: daysInMonth,
    diffYMD: diffYMD, totalDaysBetween: totalDaysBetween, nextBirthdayFrom: nextBirthdayFrom,
    ageBreakdown: ageBreakdown, westernZodiac: westernZodiac, chineseZodiac: chineseZodiac, generationFor: generationFor,
    ageDifference: ageDifference, lifePathNumber: lifePathNumber, nameNumerology: nameNumerology, loveScore: loveScore,
    fullRetirementAge: fullRetirementAge, retirementDate: retirementDate, pad: pad
  };
})();
