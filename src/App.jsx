import React, { useState, useMemo, useEffect } from 'react';
import csvData from '../Final_Result_17-04-2026 (1).csv?raw';

export default function App() {
  const [activeProgram, setActiveProgram] = useState('5');
  const [activeYear, setActiveYear] = useState(null);
  const [hofProgram, setHofProgram] = useState('5');
  
  const [rollNumber, setRollNumber] = useState('');
  const [searchedResult, setSearchedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Title Case Helper
  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
        if (word.length > 3) return word.charAt(0).toUpperCase() + word.slice(1);
        return word.toUpperCase();
    }).join(' ');
  };

  // Robust CSV Parser
  const allResults = useMemo(() => {
    if (!csvData) return [];
    const csvSplitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    const lines = csvData.split(/\r?\n/);
    if (lines.length === 0) return [];
    const headers = lines[0].split(csvSplitRegex).map(h => h.trim().replace(/^"|"$/g, ''));
    
    const recordsByRoll = new Map();

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (!row.trim()) continue;
        const values = row.split(csvSplitRegex);
        const obj = {};
        headers.forEach((h, idx) => {
            let val = values[idx] ? values[idx].trim().replace(/^"|"$/g, '') : '';
            if (obj[h] !== undefined) {
                 obj[`${h}_${idx}`] = val;
            } else {
                 obj[h] = val;
            }
        });

        const roll = obj.RollNumber?.toUpperCase();
        if (roll) {
          // Normalize Program (e.g. 'BA3' -> '3') and Year
          if (obj.Program) obj.Program = obj.Program.replace(/\D/g, '');
          if (obj.Year) obj.Year = String(obj.Year).trim();

          const existing = recordsByRoll.get(roll);
          const currentScore = parseFloat(obj['Final Score']) || 0;
          const existingScore = existing ? (parseFloat(existing['Final Score']) || 0) : -1;
          
          if (currentScore > existingScore || !existing) {
            recordsByRoll.set(roll, obj);
          }
        }
    }
    return Array.from(recordsByRoll.values());
  }, []);

  // Calculate Ranks & Winners
  const getTopRankers = (pNum, count = 3) => {
    const valid = allResults.filter(r => r.Program === pNum && r.Barcode !== 'ABSENT' && r['Final Score'] && !isNaN(parseFloat(r['Final Score'])));
    valid.sort((a,b) => parseFloat(b['Final Score']) - parseFloat(a['Final Score']));
    
    let ranked = [];
    let prevScore = -1;
    let rank = 1;
    
    valid.forEach((s, idx) => {
       const score = parseFloat(s['Final Score']);
       if(score !== prevScore) {
          rank = idx + 1;
          prevScore = score;
       }
       if (rank <= count) {
          ranked.push({...s, displayRank: rank});
       }
    });
    return ranked;
  };

  const getYearTopper = (pNum, year) => {
    const valid = allResults.filter(r => r.Program === pNum && String(r.Year) === String(year) && r.Barcode !== 'ABSENT' && r['Final Score'] && !isNaN(parseFloat(r['Final Score'])));
    valid.sort((a,b) => parseFloat(b['Final Score']) - parseFloat(a['Final Score']));
    return valid.length > 0 ? valid[0] : null;
  };

  const hof3 = useMemo(() => getTopRankers('3', 3), [allResults]);
  const hof5 = useMemo(() => getTopRankers('5', 3), [allResults]);

  const awards3 = useMemo(() => {
    const yearToppers = [];
    ['1', '2', '3'].forEach(y => {
      const t = getYearTopper('3', y);
      if (t) yearToppers.push({ year: y, student: t });
    });
    return {
      highest: getTopRankers('3', 1),
      yearToppers
    };
  }, [allResults]);

  const awards5 = useMemo(() => {
    const yearToppers = [];
    ['1', '2', '3', '4', '5'].forEach(y => {
      const t = getYearTopper('5', y);
      if (t) yearToppers.push({ year: y, student: t });
    });
    return {
      highest: getTopRankers('5', 1),
      yearToppers
    };
  }, [allResults]);

  const handleSearch = () => {
    setErrorMsg(null);
    setSearchedResult(null);

    const trimmedRoll = rollNumber.trim().toUpperCase();
    if (!trimmedRoll) {
        setErrorMsg({ title: 'Roll number required', detail: 'Please enter your roll number (example: LO10023).' });
        return;
    }

    const student = allResults.find(r => r.RollNumber?.toUpperCase() === trimmedRoll);
    
    if (!student) {
        setErrorMsg({ title: 'Roll number not found', detail: 'We could not find a record matching this roll number. Please verify and try again.' });
        return;
    }

    // Check Program Mismatch first
    if (student.Program !== activeProgram) {
        setErrorMsg({ 
          title: 'Program does not match our records', 
          detail: `This roll number is registered under ${student.Program}-Year Program. Please select the correct program above.` 
        });
        return;
    }

    // Check if Year is selected in UI, and if not or if it's wrong, show the detail
    if (!activeYear || String(student.Year) !== String(activeYear)) {
        setErrorMsg({ 
          title: 'Year does not match our records', 
          detail: `This roll number is registered under Year ${student.Year} of the ${student.Program}-Year Program.` 
        });
        return;
    }

    const isAbsent = student.Barcode === 'ABSENT' || !student['Final Score'] || isNaN(parseFloat(student['Final Score']));

    if (isAbsent) {
      setSearchedResult({
        ...student,
        isAbsent: true,
        awards: []
      });
      setTimeout(() => {
          document.getElementById('result-display')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    // Calc individual ranks
    const programStudents = allResults.filter(r => r.Program === student.Program && r.Barcode !== 'ABSENT');
    const yearStudents = programStudents.filter(r => String(r.Year) === String(student.Year));
    
    const calculateRank = (list, stu) => {
        const myScore = parseFloat(stu['Final Score']) || 0;
        let rank = 1;
        list.forEach(item => {
            if ((parseFloat(item['Final Score']) || 0) > myScore) rank++;
        });
        return rank;
    };

    const prgRank = calculateRank(programStudents, student);
    const yrRank = calculateRank(yearStudents, student);

    // Determine awards
    const awards = [];
    if (prgRank <= 3) awards.push({ type: 'top3', label: `Top 3 Overall (${student.Program}-Year Program)`, rank: prgRank });
    if (prgRank === 1) awards.push({ type: 'highest', label: `Highest Overall Score (${student.Program}-Year Program)` });
    if (yrRank === 1 && String(student.Year) === '1') awards.push({ type: 'best1', label: `Best First Year Performance (${student.Program}-Year Program)` });

    setSearchedResult({
        ...student,
        prgRank,
        yrRank,
        awards,
        isAbsent: false
    });

    setTimeout(() => {
        document.getElementById('result-display')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const renderSeal = (s) => {
    if (s.isAbsent) return 'NOT ATTEMPTED';
    if (s.awards.some(a => a.type === 'highest')) return 'Highest Overall Score';
    if (s.awards.some(a => a.type === 'top3' && a.rank === 1)) return 'Program Rank 01';
    if (s.awards.some(a => a.type === 'best1')) return 'Best First Year';
    if (s.awards.some(a => a.type === 'top3')) return 'Top 3 Honouree';
    return 'Verified Result';
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-inner">
          <div>Legal Olympiad <span style={{ color: 'var(--gold)', margin: '0 0.5rem' }}>·</span> Official Portal</div>
          <div className="topbar-right">
            <a href="#lookup">MY RESULT</a>
            <a href="#hof">HALL OF FAME</a>
            <a href="#awards">AWARDS</a>
          </div>
        </div>
      </div>

      {/* BRAND BAR */}
      <header className="brand-bar">
        <div className="brand-inner">
          <div className="brand">
            <div className="brand-mark">LO</div>
            <div className="brand-text">
              <div className="brand-name">Legal Olympiad</div>
              <div className="brand-sub">EXAMINATION 2026</div>
            </div>
          </div>
          
          <nav className="brand-nav">
            <a href="#lookup">Look up result</a>
            <a href="#hof">Rankings</a>
            <a href="#awards">Awards</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="hero" style={{ padding: 0, maxWidth: 'none' }}>
        <div className="hero-inner" style={{ padding: '4rem 2rem 3.5rem' }}>
          <div>
            <div className="hero-kicker">Results · Session 2026</div>
            <h1>Announcing the <em>Legal Olympiad</em> 2026 results</h1>
            <p>Conducted on 28 March 2026 across participating universities. Students may access their individual standing, view category awards, and review the honour roll below.</p>
          </div>
          <div className="meta-strip">
            <div className="meta-cell">
              <div className="meta-label">Exam Date</div>
              <div className="meta-value">28 Mar 2026</div>
            </div>
            <div className="meta-cell">
              <div className="meta-label">Questions</div>
              <div className="meta-value">80</div>
            </div>
            <div className="meta-cell">
              <div className="meta-label">Programs</div>
              <div className="meta-value">3-Yr · 5-Yr</div>
            </div>
            <div className="meta-cell">
              <div className="meta-label">Published</div>
              <div className="meta-value">17 Apr 2026</div>
            </div>
          </div>
        </div>
      </section>

      <main>
        {/* LOOKUP */}
        <section id="lookup">
          <div className="section-head">
            <div className="section-head-left">
              <h2>Access your result</h2>
              <p>Select your program and current year, then enter your roll number to view your official ranking and any category awards.</p>
            </div>
            <div className="section-index">§ 01 / Lookup</div>
          </div>

          <div className="lookup-grid">
            <div className="lookup-card">
              <div className="form-title">Student verification</div>
              <div className="form-subtitle">Your roll number acts as your access key. Information is read-only.</div>

              <div className="field">
                <label>Program</label>
                <div className="segmented">
                  <button onClick={() => { setActiveProgram('3'); setActiveYear(null); }} className={activeProgram === '3' ? 'active' : ''}>3-Year Program</button>
                  <button onClick={() => { setActiveProgram('5'); setActiveYear(null); }} className={activeProgram === '5' ? 'active' : ''}>5-Year Program</button>
                </div>
              </div>

              <div className="field">
                <label>Current year of study</label>
                <div className="year-grid">
                  {[1, 2, 3, 4, 5].map(y => {
                    if (activeProgram === '3' && y > 3) return null;
                    return (
                      <button key={y} onClick={() => setActiveYear(y)} className={activeYear === y ? 'active' : ''}>Year {y}</button>
                    );
                  })}
                </div>
              </div>

              <div className="field">
                <label>Roll number</label>
                <input 
                  type="text" 
                  placeholder="LO10023" 
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <button className="submit-btn" onClick={handleSearch}>View official result</button>

              {errorMsg && (
                <div className="error-card">
                  <div>
                    <strong>{errorMsg.title}</strong>
                    {errorMsg.detail}
                  </div>
                </div>
              )}

              {searchedResult && (
                <div id="result-display" className="result-wrapper fade-in">
                  <div className="result-card">
                    <div className="result-header">
                      <div className="result-header-left">
                        <div className="result-header-label">Official Result</div>
                        <div className="result-name">{toTitleCase(searchedResult.Name)}</div>
                      </div>
                      <div className="result-seal">{renderSeal(searchedResult)}</div>
                    </div>
                    <div className="result-meta-row">
                      <div className="result-meta-cell">
                        <div className="meta-label">Roll Number</div>
                        <div className="meta-value" style={{ fontFamily: 'var(--font-mono)' }}>{searchedResult.RollNumber}</div>
                      </div>
                      <div className="result-meta-cell">
                        <div className="meta-label">Program</div>
                        <div className="meta-value">{searchedResult.Program}-Year, Year {searchedResult.Year}</div>
                      </div>
                      <div className="result-meta-cell">
                        <div className="meta-label">Institution</div>
                        <div className="meta-value">{toTitleCase(searchedResult.College)}</div>
                      </div>
                    </div>

                    {searchedResult.isAbsent ? (
                      <div style={{ padding: '2.5rem 2rem', background: 'var(--ivory)', color: 'var(--ink-soft)', fontSize: '1rem', lineHeight: '1.6' }}>
                        Our records indicate you did not attempt this examination. If this is an error, please contact the examination coordinator at your institution.
                      </div>
                    ) : (
                      <>
                        <div className="rank-grid">
                          <div className="rank-block">
                            <div className="rank-label">Year {searchedResult.Year} Rank</div>
                            <div className="rank-display">
                              <span className="rank-hash">№</span>
                              <span className="rank-value">{searchedResult.yrRank}</span>
                            </div>
                            <div className="rank-note">Within the {searchedResult.Program}-Year Program, Year {searchedResult.Year} cohort.</div>
                          </div>
                          <div className="rank-block">
                            <div className="rank-label">Overall Program Rank</div>
                            <div className="rank-display">
                              <span className="rank-hash">№</span>
                              <span className="rank-value">{searchedResult.prgRank}</span>
                            </div>
                            <div className="rank-note">Across all years of the {searchedResult.Program}-Year Program.</div>
                          </div>
                          <div className="rank-block">
                            <div className="rank-label">Marks Obtained</div>
                            <div className="rank-display">
                              <span className="rank-value">{searchedResult['Final Score']}</span>
                              <span className="rank-hash" style={{ fontSize: '1rem', marginLeft: '0.25rem', fontStyle: 'normal' }}>/ 80</span>
                            </div>
                            <div className="rank-note">Final score verified by the examination board.</div>
                          </div>
                        </div>
                        <div className="awards-section" style={{ borderTop: '1px solid var(--rule)', background: 'var(--paper)' }}>
                          <div className="awards-label">Performance Breakdown</div>
                          <div className="performance-grid">
                            <div className="perf-item correct">
                              <div className="perf-label">Correct</div>
                              <div className="perf-value">{searchedResult['Total Correct']}</div>
                            </div>
                            <div className="perf-item wrong">
                              <div className="perf-label">Wrong</div>
                              <div className="perf-value">{searchedResult['Total Wrong']}</div>
                            </div>
                            <div className="perf-item blank">
                              <div className="perf-label">Unattempted</div>
                              <div className="perf-value">{searchedResult['Total Blank']}</div>
                            </div>
                          </div>
                        </div>

                        <div className="awards-section">
                          <div className="awards-label">Category Awards</div>
                          {searchedResult.awards.length > 0 ? (
                            searchedResult.awards.map((a, i) => (
                              <span key={i} className="award-pill">{a.label}</span>
                            ))
                          ) : (
                            <div className="no-awards">No category awards were conferred for this examination.</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <aside className="side-hint">
              <h4>How your rank is determined</h4>
              <div className="hint-item">
                <div className="hint-num">i.</div>
                <div className="hint-text"><strong>Year-wise Rank</strong> places you within your own year-of-study cohort and program.</div>
              </div>
              <div className="hint-item">
                <div className="hint-num">ii.</div>
                <div className="hint-text"><strong>Overall Program Rank</strong> reflects your position across all years within your program.</div>
              </div>
              <div className="hint-item">
                <div className="hint-num">iii.</div>
                <div className="hint-text"><strong>Category Awards</strong> are conferred for specific distinctions, such as Best First Year Performance.</div>
              </div>
              <div className="hint-item">
                <div className="hint-num">iv.</div>
                <div className="hint-text"><strong>Tied scores</strong> receive the same rank in keeping with standard competitive practice.</div>
              </div>
            </aside>
          </div>
        </section>

        {/* HONOUR ROLL */}
        <section id="hof" style={{ borderTop: '1px solid var(--rule)' }}>
          <div className="section-head">
            <div className="section-head-left">
              <h2>Honour roll <span style={{ color: 'var(--ink-muted)', fontWeight: 400, fontStyle: 'italic' }}>· top three</span></h2>
              <p>Overall top three rankings from each program, determined by Final Score across all years.</p>
            </div>
            <div className="section-index">§ 02 / Rankings</div>
          </div>

          <div className="hof-tabs">
            <button onClick={() => setHofProgram('5')} className={hofProgram === '5' ? 'active' : ''}>5-Year Program</button>
            <button onClick={() => setHofProgram('3')} className={hofProgram === '3' ? 'active' : ''}>3-Year Program</button>
          </div>

          <div className="podium-table">
            {(hofProgram === '5' ? hof5 : hof3).map((e, i) => (
              <div key={i} className="podium-row">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                  <span className="podium-rank">№</span>
                  <span className="podium-rank-num">{String(e.displayRank).padStart(2, '0')}</span>
                </div>
                <div>
                  <div className="podium-name">{toTitleCase(e.Name)}</div>
                  <div className="podium-college">{toTitleCase(e.College)}</div>
                  <div className="podium-meta">{e.RollNumber}</div>
                </div>
                <div className={`podium-medal ${e.displayRank === 1 ? 'gold' : (e.displayRank === 2 ? 'silver' : 'bronze')}`}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '2px' }}>Score: {e['Final Score']}</div>
                  {e.displayRank === 1 ? 'First' : (e.displayRank === 2 ? 'Second' : 'Third')} Place
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AWARDS GRID */}
        <section id="awards" style={{ borderTop: '1px solid var(--rule)' }}>
          <div className="section-head">
            <div className="section-head-left">
              <h2>Category awards</h2>
              <p>Distinctions conferred for performance within defined categories.</p>
            </div>
            <div className="section-index">§ 03 / Awards</div>
          </div>

          <div className="awards-grid">
            {['5', '3'].map(pNum => {
              const currentAwards = pNum === '5' ? awards5 : awards3;
              return (
                <div key={pNum}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--navy)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--rule)' }}>
                    {pNum}-Year <em style={{ color: 'var(--gold)' }}>Program</em>
                  </h3>
                  
                  {/* Year Performance Cards */}
                  {currentAwards.yearToppers.map((yt, idx) => (
                    <div className="award-card" key={idx}>
                      <div className="award-card-header">
                        <div className="award-card-title">Best Performance: Year {yt.year}</div>
                        <div className="award-card-tag">Yearly Topper</div>
                      </div>
                      <div className="award-card-body">
                        <div className="award-winner-row">
                          <div className="award-winner-bullet">✦</div>
                          <div className="award-winner-content">
                            <div className="award-winner-name">{toTitleCase(yt.student.Name)}</div>
                            <div className="award-winner-detail">{yt.student.RollNumber} · {toTitleCase(yt.student.College)} · <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Score: {yt.student['Final Score']}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Highest Overall Card */}
                  <div className="award-card">
                    <div className="award-card-header">
                      <div className="award-card-title">Highest Overall Score</div>
                      <div className="award-card-tag">Category II</div>
                    </div>
                    <div className="award-card-body">
                      {currentAwards.highest.map((w, i) => (
                        <div key={i} className="award-winner-row">
                          <div className="award-winner-bullet">✦</div>
                          <div className="award-winner-content">
                            <div className="award-winner-name">{toTitleCase(w.Name)}</div>
                            <div className="award-winner-detail">{w.RollNumber} · {toTitleCase(w.College)} · <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Score: {w['Final Score']}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="p-[4rem_2rem_0.5rem] max-w-[1240px] m-auto">
          <div className="disclaimer">
            <div className="disclaimer-label" style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.15em' }}>NOTE ON<br />HIGHEST OVERALL SCORE</div>
            <div className="disclaimer-text">This distinction compares students across different years of study who may have covered different portions of the syllabus. It reflects performance on this specific examination only, and should not be read as an indicator of overall academic standing. Year-wise rankings offer a more comparable measure within a single cohort.</div>
          </div>
        </div>
      </main>

      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand">Legal Olympiad <em>2026</em></div>
              <div className="footer-desc">The Legal Olympiad is an examination benchmarking legal aptitude and subject proficiency among students of 3-Year and 5-Year law programs across participating institutions.</div>
            </div>
            <div className="footer-col">
              <h5>QUICK LINKS</h5>
              <ul>
                <li><a href="#lookup">My Result</a></li>
                <li><a href="#hof">Hall of Fame</a></li>
                <li><a href="#awards">Awards</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>ADMINISTRATION</h5>
              <ul>
                <li style={{ color: 'rgba(255,255,255,0.6)' }}>Examination conducted</li>
                <li>28 March 2026</li>
                <li style={{ marginTop: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Results published</li>
                <li>17 April 2026</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 2026 LEGAL OLYMPIAD · OFFICIAL RESULTS</div>
            <div>RESULTS ARE FINAL AND BINDING</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
