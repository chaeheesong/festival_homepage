import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { IMAGE_DIR, MAP, MOBILE_QUERY, artists, contacts, experiences, navItems, programs, waves } from './data'
import './App.css'

const INSTAGRAM_URL = 'https://www.instagram.com/jeju_neulpureun?stkn=MTQ0d3VoaXV3YjBrdQ%3D%3D'
const DIRECTIONS_URL = 'https://map.naver.com/p/search/용연구름다리'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile menu when growing back to desktop width
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => !mq.matches && setMenuOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <header className={`header${menuOpen ? ' header--open' : ''}`}>
      <a href="#about" className="header__logo">용담용연 음악회 문화제</a>
      <button
        type="button"
        className="header__menu-button"
        aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav id="site-nav" className="header__nav">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
        ))}
      </nav>
    </header>
  )
}

function Hero() {
  // Aspect ratio of whichever photo is showing (desktop or mobile), so the section
  // height adapts when the image files are replaced
  const [photoRatio, setPhotoRatio] = useState<number>()

  return (
    <section
      id="about"
      className="hero"
      style={photoRatio ? ({ '--photo-ratio': photoRatio } as CSSProperties) : undefined}
    >
      <picture>
        <source media={MOBILE_QUERY} srcSet={`${IMAGE_DIR}/hero-bg-mobile.png`} />
        <img
          className="hero__bg"
          src={`${IMAGE_DIR}/hero-bg.png`}
          alt=""
          onLoad={(e) => setPhotoRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        />
      </picture>
      <div className="hero__content">
        <div className="hero__meta">
          <span className="desktop-only">2026. 10. 31. 토요일</span>
          <span className="mobile-only">2026. 10. 31. (토)</span>
          <span className="hero__divider" aria-hidden />
          <span className="hero__place">용연 구름다리 일대</span>
        </div>
        <h1 className="hero__title">
          <span className="desktop-only">용담·용연 음악회·문화제</span>
          <span className="mobile-only">용담용연<br />음악회 문화제</span>
        </h1>
        <p className="hero__slogan">“용연, 천년의 물결을 잇다”</p>
        <div className="hero__lineup">
          <p className="hero__lineup-label">출연</p>
          <ul className="hero__artists">
            {artists.map((artist) => (
              <li key={artist.name}>
                <img src={artist.image} alt={artist.name} width={84} height={84} />
                <span>{artist.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function Recruit() {
  return (
    <section id="apply" className="recruit">
      <div className="recruit__head">
        <h2 className="heading-serif">함께할 참가자를 모집합니다</h2>
        <div className="recruit__deadline">
          <span className="recruit__deadline-label">신청 마감</span>
          <span className="recruit__deadline-date">
            <span className="desktop-only">2026. </span>10. 20. (화) 18:00
          </span>
        </div>
      </div>
      <ul className="recruit__cards">
        {programs.map((p) => (
          <li key={p.no}>
            <a className="program-card" href={`?p=${p.apply}`}>
              <span className="program-card__no">{p.no}</span>
              <h3 className="program-card__title">{p.title}</h3>
              <div className="program-card__body">
                {p.description && <p className="program-card__desc">{p.description}</p>}
                {p.capacity && <p className="program-card__capacity">{p.capacity}</p>}
                {p.note && <p className="program-card__note">{p.note}</p>}
              </div>
              <span className="program-card__button">
                신청<span className="desktop-only">하기</span> →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Schedule() {
  return (
    <section id="schedule" className="schedule">
      <div className="schedule__head">
        <p className="section-eyebrow section-eyebrow--gold">프로그램 시간표</p>
        <h2 className="schedule__date">10월 31일 토요일</h2>
      </div>
      <div className="timetable" role="table" aria-label="프로그램 시간표">
        <div className="timetable__header" role="row">
          <span role="columnheader" className="col-wave">구분</span>
          <span role="columnheader" className="col-title">프로그램</span>
          <span role="columnheader" className="col-time">시간</span>
          <span role="columnheader" className="col-detail">내용</span>
        </div>
        {waves.map((wave) => (
          <div key={wave.label} className="timetable__group" role="rowgroup">
            <div className="timetable__wave col-wave">
              <strong style={{ color: wave.color }}>{wave.label}</strong>
              <span>{wave.theme}</span>
            </div>
            <div className="timetable__rows">
              {wave.items.map((item) => (
                <div key={item.title} className="timetable__row" role="row">
                  <span role="cell" className="col-title">{item.title}</span>
                  <span role="cell" className="col-time">{item.time}</span>
                  <span role="cell" className="col-detail">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Experience() {
  return (
    <section id="experience" className="experience">
      <div>
        <p className="section-eyebrow">체험존</p>
        <h2 className="experience__subtitle">직접 만들고 담아가는 용연</h2>
      </div>
      <div className="experience__cards">
        {experiences.map((exp) => (
          <article key={exp.title} className="experience-card">
            <picture className="experience-card__bg" aria-hidden>
              <source media={MOBILE_QUERY} srcSet={exp.mobileImage} />
              <img
                src={exp.image}
                alt=""
                style={{
                  '--crop-left': exp.crop.left,
                  '--crop-top': exp.crop.top,
                  '--crop-width': exp.crop.width,
                  '--crop-height': exp.crop.height,
                } as CSSProperties}
              />
            </picture>
            <div className="experience-card__text">
              <h3>{exp.title}</h3>
              <p>{exp.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Location() {
  return (
    <section id="location" className="location">
      <a
        className="location__map"
        href={MAP.kakaoUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="카카오맵에서 용연 구름다리 위치 보기"
      >
        <div
          className="location__map-canvas"
          style={{ '--map-ratio': MAP.width / MAP.height } as CSSProperties}
        >
          <img src={MAP.image} alt="용연 구름다리 일대 약도" />
          <span className="location__marker" style={{ left: MAP.marker.x, top: MAP.marker.y }}>
            <span className="location__marker-label">용연 구름다리</span>
            <svg width="28" height="36" viewBox="0 0 28 36" aria-hidden>
              <path d="M14 0C6.27 0 0 6.13 0 13.7 0 24 14 36 14 36s14-12 14-22.3C28 6.13 21.73 0 14 0Z" fill="#2f58c9" />
              <circle cx="14" cy="13.5" r="5" fill="#fff" />
            </svg>
          </span>
        </div>
        <span className="location__map-hint">카카오맵에서 보기 ↗</span>
      </a>
      <div className="location__info">
        <div className="location__heading">
          <p className="section-eyebrow section-eyebrow--small">오시는 길</p>
          <h2 className="heading-serif">용연 구름다리 일대</h2>
        </div>
        <p className="location__address">
          제주특별자치도 제주시 용담1동
          <br />
          용연 구름다리 일대
        </p>
        <a
          className="pill-button pill-button--shadow location__button"
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noreferrer"
        >
          길찾기
        </a>
      </div>
    </section>
  )
}

function Instagram() {
  return (
    <section>
      <a className="instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
        <div>
          <h2 className="instagram__title">공식 인스타그램</h2>
          <p className="instagram__handle">@jeju_neulpureun</p>
        </div>
        <span className="pill-button pill-button--lg instagram__button">인스타그램에서 보기 ↗</span>
      </a>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__contact">
        <span className="footer__contact-label">전화문의</span>
        {contacts.map((c, i) => (
          <div key={c.tel} className="footer__contact-item">
            {i > 0 && <span className="footer__divider" aria-hidden />}
            <span className="footer__office">
              {c.desktopPrefix && <span className="desktop-only">{c.desktopPrefix} </span>}
              {c.office}
            </span>
            <a className="footer__tel" href={`tel:${c.tel}`}>{c.tel}</a>
          </div>
        ))}
      </div>
      <div className="footer__bottom">
        <div className="footer__credits">
          <span className="desktop-only">2026 용담용연 음악회 문화제</span>
          <span>주최·주관 : 제주시 용담1·2동 주민센터, 용담 축제위원회</span>
          <span>후원 : 한국공항공사 제주공항</span>
        </div>
        <p className="footer__copyright">Copyright 2026 용담용연 음악회 문화제 All Rights Reserved.</p>
      </div>
    </footer>
  )
}

export default function App() {
  // Sections render after load, so jump to "#apply" etc. (e.g. from the application page) once mounted
  useEffect(() => {
    if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView()
  }, [])

  return (
    <div className="page">
      <Header />
      <main>
        <Hero />
        <Recruit />
        <Schedule />
        <Experience />
        <Location />
        <Instagram />
      </main>
      <Footer />
    </div>
  )
}
