import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, BookOpen, Clock3, Compass, Flag, GraduationCap, Landmark, MapPinned, Menu, Play, Send, ShieldCheck, Users, X, Sparkles, Activity } from 'lucide-react';
import { people, facts, theses, survey, tasks } from './data';

const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/(rest\/v1\/?)?$/, ''),
      key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
      db = url && key ? createClient(url, key) : null;

const nav = [
  ['Басты бет', 'home'],
  ['Карта', 'map'],
  ['Хронология', 'timeline'],
  ['Тұлғалар', 'people'],
  ['Оқу', 'learn'],
  ['Видео', 'videos'],
  ['Ойын', 'game'],
  ['Сауалнама', 'survey'],
  ['Нәтиже', 'results']
];

function App() {
  const [active, setActive] = useState('home'),
        [mobile, setMobile] = useState(false),
        [mapPick, setMapPick] = useState(0),
        [ti, setTi] = useState(0),
        [answers, setAnswers] = useState({}),
        [checked, setChecked] = useState({}),
        [surveyAnswers, setSurveyAnswers] = useState({}),
        [surveyMsg, setSurveyMsg] = useState(''),
        [busy, setBusy] = useState(false),
        [stats, setStats] = useState({ total: 0, questions: {} }),
        [statsMsg, setStatsMsg] = useState(''),
        [search, setSearch] = useState(''),
        [allFacts, setAllFacts] = useState(false);

  const score = tasks.reduce((s, t, i) => s + (checked[i] && answers[i] === t.correct ? 1 : 0), 0),
        done = Object.keys(checked).length;

  const go = id => {
    setActive(id);
    setMobile(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  async function loadStats() {
    if (!db) {
      const rows = JSON.parse(localStorage.getItem('azattyq_demo') || '[]');
      const questions = {};
      rows.forEach(row => Object.entries(row).forEach(([id, v]) => {
        if (id === 'q10') {
          questions[id] ??= { type: 'open', answers: [] };
          if (v) questions[id].answers.push(v);
        } else {
          questions[id] ??= { type: 'choice', counts: {} };
          (Array.isArray(v) ? v : [v]).forEach(x => {
            if (x) questions[id].counts[x] = (questions[id].counts[x] || 0) + 1;
          });
        }
      }));
      setStats({ total: rows.length, questions });
      setStatsMsg('Демо режимі: жауаптар тек осы браузерде сақталады. Ортақ статистика үшін Supabase қосыңыз.');
      return;
    }
    const { data, error } = await db.rpc('get_survey_stats');
    if (error) {
      setStatsMsg('Статистика қатесі: ' + error.message);
      return;
    }
    setStats(data);
    setStatsMsg('Supabase деректер базасынан жаңартылды.');
  }

  useEffect(() => { loadStats() }, []);

  async function submitSurvey(e) {
    e.preventDefault();
    if (survey.some(q => q.id !== 'q10' && !surveyAnswers[q.id]?.length && !surveyAnswers[q.id])) {
      setSurveyMsg('1–9 сұрақтардың барлығына жауап беріңіз.');
      return;
    }
    setBusy(true);
    if (db) {
      const { error } = await db.from('survey_responses').insert({ answers: surveyAnswers });
      if (error) setSurveyMsg('Жіберу қатесі: ' + error.message);
      else {
        setSurveyMsg('Рақмет! Жауабыңыз сақталды.');
        setSurveyAnswers({});
        await loadStats();
      }
    } else {
      const rows = JSON.parse(localStorage.getItem('azattyq_demo') || '[]');
      rows.push(surveyAnswers);
      localStorage.setItem('azattyq_demo', JSON.stringify(rows));
      setSurveyMsg('Демо жауап осы браузерде сақталды. Supabase қосылса, барлық респонденттің жауаптары біріктіріледі.');
      setSurveyAnswers({});
      await loadStats();
    }
    setBusy(false);
  }

  function choose(q, v, multi) {
    setSurveyAnswers(p => ({
      ...p,
      [q]: multi ? ((p[q] || []).includes(v) ? p[q].filter(x => x !== v) : [...(p[q] || []), v]) : v
    }));
  }

  return (
    <div>
      <header className="top">
        <a className="brand" href="#home" onClick={e => { e.preventDefault(); go('home'); }}>
          <span className="logo"><Landmark /></span>
          <span><b>АЗАТТЫҚ ЖОЛЫ</b><small>ТАРИХИ ЗЕРТТЕУ ЖОБАСЫ</small></span>
        </a>
        <button className="mobile" onClick={() => setMobile(!mobile)}>{mobile ? <X /> : <Menu />}</button>
        <nav className={mobile ? 'nav open' : 'nav'}>
          {nav.map(([t, id]) => <button className={active === id ? 'on' : ''} key={id} onClick={() => go(id)}>{t}</button>)}
        </nav>
        <button className="topbtn" onClick={() => go('game')}>Білімді тексеру ↗</button>
      </header>

      <section className="hero" id="home">
        <div className="heroText">
          <span className="tag">✦ ИНТЕРАКТИВТІ ТАРИХ ПЛАТФОРМАСЫ</span>
          <h1>Азаттыққа<br /><em>ұмтылған</em> дала.</h1>
          <p>XVIII–XIX ғасырлардағы қазақ халқының отаршылдыққа қарсы күресі. Тарихи оқиғаларды зертте, тұлғаларды таны, біліміңді ойын арқылы сына.</p>
          <div className="actions">
            <button className="gold" onClick={() => go('learn')}>Зерттеуді бастау <ArrowRight size={16} /></button>
            <button className="outline dark" onClick={() => go('timeline')}><Clock3 size={16} /> Хронология</button>
          </div>
          <div className="stats">
            <div><b>30</b><span>тарихи факт</span></div>
            <div><b>10</b><span>тарихи тұлға</span></div>
            <div><b>5</b><span>интерактивті тапсырма</span></div>
          </div>
        </div>
        <div className="heroArt">
          <div className="ring r1"></div>
          <div className="ring r2"></div>
          <div className="seal"><Compass size={78} /><span>ҚАЗАҚ<br />ДАЛАСЫ</span></div>
          <div className="float f1">● ТАРИХИ ЖАД</div>
          <div className="float f2"><b>1783 — 1870</b><small>ҚАРСЫЛЫҚ ҚОЗҒАЛЫСТАРЫ</small></div>
        </div>
        <button className="down" onClick={() => go('intro')}>Төмен қарай ↓</button>
      </section>

      <section className="section white" id="intro">
        <span className="eyebrow">01 / КОНТЕКСТ</span>
        <div className="introGrid">
          <h2>Тарихты білу —<br /><em>болашақты</em> түсіну.</h2>
          <div>
            <p>XVIII–XIX ғасырларда Ресей империясы қазақ даласындағы ықпалын әскери бекіністер, әкімшілік реформалар және жер саясаты арқылы кеңейтті. Бұл өзгерістер дәстүрлі басқару жүйесіне, жер қатынастарына және халықтың тұрмысына әсер етті.</p>
            <p>Әртүрлі кезеңде тұтанған көтерілістердің мақсаты мен құрамы бірдей болған жоқ. Оларды тарихи жағдайымен бірге қарастыру отарлық саясатқа қарсылықтың себептерін және азаттық идеясын түсінуге мүмкіндік береді.</p>
          </div>
        </div>
      </section>

      <section className="section" id="timeline">
        <SectionTitle eyebrow="02 / ХРОНОЛОГИЯ" title="Қарсылықтың тарихи белестері" desc="Көтерілістерді уақыт ретімен қарап, әр кезеңнің ерекшелігін салыстыр." />
        <div className="timeline">
          {[
            ['1783–1797', 'Сырым Датұлы бастаған көтеріліс', 'Жер мәселесі, Жайық казактарының қысымы және хан билігіне наразылық.'],
            ['1825–1836', 'Саржан Қасымұлы бастаған қозғалыс', 'Округтік басқару жүйесіне және патша бекіністеріне қарсы қарсылық.'],
            ['1836–1838', 'Исатай мен Махамбет көтерілісі', 'Бөкей Ордасындағы жер тапшылығы мен әлеуметтік теңсіздікке қарсы күрес.'],
            ['1837–1847', 'Кенесары Қасымұлы қозғалысы', 'Қазақ жерінің тұтастығы мен саяси дербестігін қалпына келтіру талабы.'],
            ['1847–1858', 'Есет Көтібарұлы қозғалысы', 'Батыс өңірдегі отарлық басқару мен жер саясатына қарсылық.'],
            ['1856–1857', 'Жанқожа Нұрмұхамедұлы көтерілісі', 'Сырдария бойындағы отарлық қысым мен бекіністерге қарсы қозғалыс.'],
            ['1870', 'Маңғыстау көтерілісі', 'Әкімшілік реформалар, салық және басқару өзгерістеріне қарсылық.']
          ].map((x, i) => (
            <article className="time" key={x[0]}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <small>{x[0]} · КЕЗЕҢ {i + 1}</small>
                <h3>{x[1]}</h3>
                <p>{x[2]}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="note"><ShieldCheck size={16} /> Ескерту: кейбір тарихи еңбектерде көтерілістердің кезеңдері әртүрлі белгіленуі мүмкін. Даталарды оқулықпен салыстырыңыз.</p>
      </section>

      <section className="section mapSection" id="map">
        <SectionTitle eyebrow="02 / ТАРИХИ КАРТА" title="Қарсылық қозғалыстарының географиясы" desc="Бұл — оқытуға арналған сызбалық карта. Нүктені таңдап, көтеріліс өткен өңір мен оның тарихи ерекшелігін қараңыз." />
        <div className="mapLayout">
          <div className="mapCanvas">
            <div className="mapLabel mapNorth">ОРТА ЖҮЗ</div>
            <div className="mapLabel mapWest">КІШІ ЖҮЗ</div>
            <div className="mapLabel mapSouth">СЫР БОЙЫ</div>
            <svg viewBox="0 0 620 390" role="img" aria-label="Қазақ даласының сызбалық картасы">
              <path className="land" d="M62 112 L105 74 L166 82 L204 48 L271 69 L321 53 L370 82 L423 71 L474 101 L531 95 L566 136 L543 169 L566 207 L521 235 L483 263 L439 253 L401 287 L347 278 L313 316 L264 299 L221 323 L177 294 L140 278 L120 239 L85 221 L98 183 L65 163 Z" />
              <path className="river" d="M170 84 Q195 128 171 167 T180 238 M321 60 Q301 112 333 151 T318 221 M432 91 Q405 139 445 180 T438 245" />
              <path className="borderline" d="M105 150 L210 130 L295 151 L390 132 L502 154 M139 236 L244 217 L330 234 L423 213 L520 225" />
              {[[140, 150, '0'], [250, 183, '1'], [350, 130, '2'], [415, 205, '3'], [315, 265, '4'], [190, 250, '5']].map(([x, y, id]) => (
                <g key={id} onClick={() => setMapPick(Number(id))} className={'mapPoint ' + (mapPick === Number(id) ? 'picked' : '')} role="button" tabIndex="0" aria-label="Оқиғаны таңдау">
                  <circle cx={x} cy={y} r={mapPick === Number(id) ? 13 : 9} />
                  <text x={x} y={y + 4}>{Number(id) + 1}</text>
                </g>
              ))}
            </svg>
            <div className="mapLegend"><span><i /> Көтеріліс ошақтары</span><span>Сызбалық көрініс · дәл географиялық шекара емес</span></div>
          </div>
          <article className="mapInfo">
            <small>ТАҢДАЛҒАН ӨҢІР · 0{mapPick + 1}</small>
            <h3>{['Батыс Қазақстан', 'Бөкей Ордасы', 'Орталық Қазақстан', 'Ақмола өңірі', 'Сырдария бойы', 'Маңғыстау'][mapPick]}</h3>
            <b>{['Сырым Датұлы көтерілісі · 1783–1797', 'Исатай–Махамбет көтерілісі · 1836–1838', 'Кенесары Қасымұлы қозғалысы · 1837–1847', 'Кенесары қозғалысы · 1838', 'Жанқожа Нұрмұхамедұлы көтерілісі · 1856–1857', 'Маңғыстау көтерілісі · 1870'][mapPick]}</b>
            <p>{['Кіші жүздегі жер мәселесі, Жайық казактарының қысымы және хан билігіне наразылық.', 'Жер тапшылығы, әлеуметтік теңсіздік және жергілікті билікке қарсылық.', 'Қазақ жерінің тұтастығын және саяси дербестігін қалпына келтіру талабы.', 'Ақмола бекінісіне шабуыл қозғалыстың белгілі оқиғаларының бірі болды.', 'Отарлық қысым мен бекіністердің кеңеюіне қарсы қозғалыс.', 'Әкімшілік өзгерістер мен салық саясатына қарсы наразылық.'][mapPick]}</p>
            <button className="outline" onClick={() => go('timeline')}>Хронологиядан оқу →</button>
          </article>
        </div>
      </section>

      <section className="section white" id="people">
        <SectionTitle eyebrow="03/ ТАРИХИ ТҰЛҒАЛАР" title="Еркіндік идеясын көтерген тұлғалар" desc="Көтерілістерге қатысқан жетекшілер мен күрескерлердің рөлін зертте." />
        <input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Тұлға немесе кезең бойынша іздеу…" />
        <div className="people">
          {people.filter(p => p.join(' ').toLowerCase().includes(search.toLowerCase())).map((p, i) => (
            <article className="person" key={p[0]}>
              <span className="personNum">{String(i + 1).padStart(2, '0')}</span>
              <small>{p[1]}</small>
              <h3>{p[0]}</h3>
              <label>{p[2]}</label>
              <p>{p[4]}</p>
              <footer>⚑ {p[3]}</footer>
            </article>
          ))}
        </div>
      </section>

      <section className="section tint" id="learn">
        <SectionTitle eyebrow="04 / ОҚУ МАТЕРИАЛЫ" title="Есте сақтауға арналған негізгі деректер" desc="10 негізгі тезис пен 30 тарихи фактіні оқып, оқиғалардың себеп-салдарын байланыстырыңыз." />
        <div className="learnGrid">
          <article className="panel">
            <span className="eyebrow">A / НЕГІЗГІ ОЙЛАР</span>
            <h3>10 тарихи тезис</h3>
            {theses.map((t, i) => (
              <div className="thesis" key={t}>
                <b>{String(i + 1).padStart(2, '0')}</b>
                <p>{t}</p>
              </div>
            ))}
          </article>
          <article className="panel">
            <span className="eyebrow">B / ДЕРЕКТЕР ҚОРЫ</span>
            <h3>30 нақты тарихи факт</h3>
            {(allFacts ? facts : facts.slice(0, 10)).map((f, i) => (
              <div className="fact" key={i}>
                <b>{f[0]}</b>
                <p>{f[1]}</p>
              </div>
            ))}
            <button className="outline full" onClick={() => setAllFacts(!allFacts)}>
              {allFacts ? 'Қысқарту' : '30 фактінің барлығын көру'}⌄
            </button>
          </article>
        </div>
        <div className="causes">
          {[
            ['⌖', 'АЛҒЫШАРТТАР', 'Жер мен кеңістік', 'Әскери шептер мен бекіністер жайылымдарды пайдалану мүмкіндігін шектеді.'],
            ['▤', 'САЯСИ СЕБЕПТЕР', 'Басқару жүйесі', 'Хандық биліктің жойылуы дәстүрлі саяси құрылымды өзгертті.'],
            ['◈', 'ӘЛЕУМЕТТІК СЕБЕПТЕР', 'Тұрмыс ауыртпалығы', 'Алым-салық пен әлеуметтік жіктелу халық наразылығын туғызды.'],
            ['⚔', 'ЖЕҢІЛУ СЕБЕПТЕРІ', 'Күш теңсіздігі', 'Қару-жарақ айырмашылығы, үйлестіру қиындығы және ішкі келіспеушілік әсер етті.']
          ].map(x => (
            <article className="cause" key={x[2]}>
              <span>{x[0]}</span>
              <small>{x[1]}</small>
              <h3>{x[2]}</h3>
              <p>{x[3]}</p>
            </article>
          ))}
        </div>
      </section>

      
<section className="section white" id="videos">
  <SectionTitle
    eyebrow="05 / БЕЙНЕМАТЕРИАЛДАР"
    title="Тарихты бейне арқылы таны"
    desc="Қазақстан тарихындағы маңызды көтерілістер мен ұлт-азаттық қозғалыстар туралы бейнематериалдар."
  />

  <div className="videos">
    {[
      {
        id: '01',
        title: 'Сырым Датұлы көтерілісі',
        desc: 'Көтерілістің алғышарттары мен Кіші жүздегі жағдай',
        videoId: 'lg3x1T_X7ns'
      },
      {
        id: '02',
        title: 'Исатай–Махамбет қозғалысы',
        desc: 'Бөкей Ордасындағы жер мәселесі мен көтерілістің барысы',
        videoId: 'z6vLw3psEv4'
      },
      {
        id: '03',
        title: 'Кенесары Қасымұлы қозғалысы',
        desc: 'Қозғалыстың мақсаты, барысы және тарихи маңызы',
        videoId: '0lIiDwFEYso'
      }
    ].map(v => (
      <article className="video" key={v.id}>
        <div className="video-player">
          <iframe
            src={`https://www.youtube.com/embed/${v.videoId}`}
            title={v.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        <div className="video-info">
          <span className="video-number">{v.id}</span>
          <h3>{v.title}</h3>
          <p>{v.desc}</p>
        </div>
      </article>
    ))}
  </div>
</section>


      <section className="section darksec" id="game">
        <SectionTitle eyebrow="06 / БІЛІМДІ ТЕКСЕРУ" title="Тарихи сынақ" desc="Бес тапсырманы орында. Әр жауаптан кейін дұрыс жауабын, түсіндірмесін және ұпайыңды көресің." />
        <div className="game">
          <aside>
            <small>СЕНІҢ НӘТИЖЕҢ</small>
            <div className="score">{score}<span> / 5</span></div>
            <p>дұрыс жауап</p>
            <div className="progress"><i style={{ width: `${done / 5 * 100}%` }} /></div>
            {tasks.map((t, i) => (
              <button className={ti === i ? 'taskNav selected' : 'taskNav'} key={t.title} onClick={() => setTi(i)}>
                {String(i + 1).padStart(2, '0')} {checked[i] ? (answers[i] === t.correct ? '✓' : '×') : '○'}
              </button>
            ))}
            <button className="reset" onClick={() => { setAnswers({}); setChecked({}); setTi(0); }}>Тестті қайта бастау ↺</button>
          </aside>
          <article className="question">
            <div className="qtop">ТАПСЫРМА {ti + 1} / 05 <span>{checked[ti] ? 'ТЕКСЕРІЛДІ' : 'БІР ДҰРЫС ЖАУАП'}</span></div>
            <h3>{tasks[ti].title}</h3>
            <p>{tasks[ti].prompt}</p>
            <div className="options">
              {tasks[ti].options.map((o, i) => (
                <button
                  key={o}
                  disabled={!!checked[ti]}
                  className={'option ' + (checked[ti] && i === tasks[ti].correct ? 'correct' : checked[ti] && answers[ti] === i ? 'wrong' : answers[ti] === i ? 'chosen' : '')}
                  onClick={() => setAnswers(a => ({ ...a, [ti]: i }))}
                >
                  <b>{String.fromCharCode(65 + i)}</b>{o}{checked[ti] && i === tasks[ti].correct ? ' ✓' : ''}
                </button>
              ))}
            </div>
            {checked[ti] && (
              <div className={answers[ti] === tasks[ti].correct ? 'feedback good' : 'feedback'}>
                <b>{answers[ti] === tasks[ti].correct ? 'Дұрыс жауап!' : 'Бұл жауап дұрыс емес.'}</b>
                <p>{tasks[ti].explain}</p>
              </div>
            )}
            <div className="qfoot">
              <span>{done} / 5 аяқталды</span>
              {!checked[ti] ? (
                <button className="gold" onClick={() => { if (answers[ti] !== undefined) setChecked(c => ({ ...c, [ti]: true })); else alert('Алдымен жауап нұсқасын таңдаңыз.'); }}>Жауапты тексеру →</button>
              ) : ti < 4 ? (
                <button className="gold" onClick={() => setTi(ti + 1)}>Келесі тапсырма →</button>
              ) : (
                <button className="gold" onClick={() => go('results')}>Қорытындыны көру →</button>
              )}
            </div>
            {done === 5 && (
              <div className="feedback good">
                <b>Қорытынды: {score * 20}%</b>
                <p>{score >= 4 ? 'Тамаша! Тақырыпты жақсы меңгергенсің.' : score >= 3 ? 'Жақсы нәтиже. Түсіндірмелерді қайталап шық.' : 'Оқу материалын қайта қарап, тестті тағы орында.'}</p>
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="section tint" id="survey">
        <SectionTitle eyebrow="07 / ЗЕРТТЕУ" title="Қоғамның тарихи сауаттылығын зерттеу" desc="10 сұраққа жауап беріп, тарихи білім мен оқу форматтары туралы пікір білдір." />
        <div className="surveyLayout">
          <aside className="surveyAside">
            <Users size={28} />
            <h3>Сенің пікірің маңызды</h3>
            <p>Сауалнамада жабық, көп нұсқалы және ашық сұрақтар бар. Аты-жөніңізді енгізудің қажеті жоқ.</p>
            <div className="surveyStats">
              <b>10<small>сұрақ</small></b>
              <b>3<small>сұрақ түрі</small></b>
              <b>{stats.total}<small>жауап</small></b>
            </div>
            <p><ShieldCheck size={15} /> Жеке деректер сұралмайды; тек жиынтық статистика көрсетіледі.</p>
          </aside>
          <form className="form" onSubmit={submitSurvey}>
            <h3>Сұрақтарға жауап беріңіз</h3>
            {survey.map(q => (
              <fieldset key={q.id}>
                <legend>{q.title}{q.id !== 'q10' ? ' *' : ''}</legend>
                {q.type === 'open' ? (
                  <textarea rows="3" maxLength="500" placeholder={q.placeholder} value={surveyAnswers[q.id] || ''} onChange={e => setSurveyAnswers(p => ({ ...p, [q.id]: e.target.value }))} />
                ) : (
                  <div className="surveyOptions">
                    {q.options.map(o => (
                      <label key={o}>
                        <input
                          type={q.type === 'multi' ? 'checkbox' : 'radio'}
                          name={q.id}
                          checked={q.type === 'multi' ? (surveyAnswers[q.id] || []).includes(o) : surveyAnswers[q.id] === o}
                          onChange={() => choose(q.id, o, q.type === 'multi')}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                )}
                {q.type === 'multi' && <small>Бірнеше жауап таңдауға болады.</small>}
              </fieldset>
            ))}
            <button className="gold submit" disabled={busy}>{busy ? 'Жіберілуде…' : 'Жауаптарды жіберу'} <Send size={15} /></button>
            {surveyMsg && <p className="message">{surveyMsg}</p>}
          </form>
        </div>
      </section>

      <section className="section white" id="results">
        <SectionTitle eyebrow="08 / НӘТИЖЕЛЕР" title="Зерттеу нәтижелері" desc="Респондент саны нақты жауаптардан есептеледі. Жауаптар жиналмай тұрып қорытынды жасалмайды." />
        <div className="resultHead">
          <div>
            <small>ЖИНАЛҒАН ЖАУАП</small>
            <b>{stats.total}</b>
            <span>респондент</span>
          </div>
          <p>{statsMsg || 'Статистика жүктелуде…'} <button onClick={loadStats}>Жаңарту ↻</button></p>
        </div>
        {stats.total === 0 ? (
          <div className="empty">
            <Activity size={30} />
            <h3>Әзірге жауаптар жиналмаған</h3>
            <p>Сауалнама сілтемесін аудиторияға таратыңыз. Бірінші жауап келгеннен кейін статистика көрінеді.</p>
            <button className="outline" onClick={() => go('survey')}>Сауалнамаға өту →</button>
          </div>
        ) : (
          <div className="analytics">
            {survey.filter(q => q.id !== 'q10').map(q => {
              const counts = stats.questions?.[q.id]?.counts || {},
                    rows = Object.entries(counts).sort((a, b) => b[1] - a[1]),
                    max = Math.max(1, ...rows.map(x => x[1]));
              return (
                <article className="analytic" key={q.id}>
                  <small>{q.id.toUpperCase()} / СҰРАҚ ТАЛДАУЫ</small>
                  <h3>{q.title}</h3>
                  {rows.map(([name, n]) => (
                    <div className="barrow" key={name}>
                      <span>{name}</span>
                      <b>{n} ({Math.round(n / stats.total * 100)}%)</b>
                      <i><em style={{ width: (n / max * 100) + '%' }} /></i>
                    </div>
                  ))}
                  <p><b>Талдау:</b> Ең жиі таңдалған жауап — {rows[0]?.[0] || 'жоқ'} ({rows[0]?.[1] || 0} жауап, {Math.round((rows[0]?.[1] || 0) / stats.total * 100)}%). Бұл тек сауалнамаға қатысқандардың пікірін сипаттайды.</p>
                </article>
              );
            })}
            <article className="analytic">
              <small>Q10 / АШЫҚ СҰРАҚ</small>
              <h3>Қатысушылардың ұсыныстары</h3>
              {(stats.questions?.q10?.answers || []).length ? stats.questions.q10.answers.slice(0, 20).map((a, i) => <p key={i}>{a}</p>) : <p>Ашық сұраққа жауап әлі түскен жоқ.</p>}
            </article>
          </div>
        )}
        <div className="conclusion">
          <Sparkles />
          <div>
            <small>ҚОРЫТЫНДЫ ҮЛГІСІ</small>
            <h3>Дерекке сүйенген қорытынды</h3>
            <p>100 жауап жиналғаннан кейін респондент саны, әр жауаптың үлесі және ашық жауаптардағы қайталанатын ойлар бойынша қорытынды жазыңыз. Нақты статистиканы осы бөлімнен алуға болады.</p>
          </div>
        </div>
      </section>

      <section className="section tint" id="sources">
        <SectionTitle eyebrow="09 / ДЕРЕККӨЗДЕР" title="Әрі қарай зерттеу үшін" desc="Тарихи нақтылықты оқулықтармен және сенімді дерекқорлармен салыстырып тексер." />
        <div className="sources">
          {[
            ['Қазақстан тарихы порталы', 'e-history.kz — тарихи мақалалар мен тұлғалар', 'https://e-history.kz/kz'],
            ['Қазақстан Республикасы Президентінің ресми сайты', 'Ресми материалдар мен құжаттар', 'https://www.akorda.kz/kz'],
            ['Kitap.kz', 'Кітаптар мен тарихи әдебиеттер', 'https://kitap.kz/'],
            ['Академиялық еңбектерді іздеу', 'Монографиялар мен оқулықтарды салыстыру', 'https://www.google.com/search?q=Қазақстан+тарихы+XVIII-XIX+ғасыр+көтерілістер+академиялық+еңбек']
          ].map((s, i) => (
            <a href={s[2]} target="_blank" rel="noreferrer" key={s[0]}>
              <b>0{i + 1}</b>
              <span><strong>{s[0]}</strong><small>{s[1]}</small></span>↗
            </a>
          ))}
        </div>
        <p className="disclaimer">Бұл — оқу жобасының бастапқы нұсқасы. Тапсырар алдында даталар мен тұлғалардың өмірбаянын оқытушы ұсынған оқулықпен салыстырып, нақты пайдаланылған әдебиеттер тізімін толықтырыңыз.</p>
      </section>

      <footer className="footer">
        <div className="brand">
          <span className="logo"><Landmark /></span>
          <span><b>АЗАТТЫҚ ЖОЛЫ</b><small>ТАРИХИ ЖАД · ҰЛТТЫҚ МҰРА</small></span>
        </div>
        <p>Өткенді таны. Деректі тексер. Тарихты түсін.</p>
        <button onClick={() => go('home')}>Жоғарыға ↑</button>
        <small className="copy">© 2026 · Оқу мақсатындағы интерактивті жоба</small>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title, desc }) {
  return (
    <div className="sectionTitle">
      <small>{eyebrow}</small>
      <h2>{title}</h2>
      <p>{desc}</p>
    </div>
  );
}

export default App;
