import React, { useState, useMemo } from 'react';
import { ArrowRight, AlertCircle, ArrowLeft, Menu, X } from 'lucide-react';
import csvData from '../Final_Result_17-04-2026.csv?raw';

export default function App() {
  const [activeProgram, setActiveProgram] = useState('3-Year Program');
  const [activeYear, setActiveYear] = useState(1);
  const [activeHonourProgram, setActiveHonourProgram] = useState('5-Year Program');
  
  const [rollNumber, setRollNumber] = useState('');
  const [searchedResult, setSearchedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Parse CSV Data
  const allResults = useMemo(() => {
    if (!csvData) return [];
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (!row.trim()) continue;
        const values = row.split(',');
        const obj = {};
        headers.forEach((h, idx) => {
            if (obj[h] !== undefined && obj[h] !== '') {
                 obj[`${h}_${idx}`] = values[idx] ? values[idx].trim() : '';
            } else {
                 obj[h] = values[idx] ? values[idx].trim() : '';
            }
        });
        data.push(obj);
    }
    return data;
  }, []);

  const honourRollStudents = useMemo(() => {
    if (!allResults.length) return [];
    const pNum = activeHonourProgram.startsWith('5') ? '5' : '3';
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
       if (rank <= 3) {
          ranked.push({...s, displayRank: rank});
       }
    });
    return ranked.slice(0, 3);
  }, [allResults, activeHonourProgram]);

  const getBestFirstYear = (pNum) => {
    const valid = allResults.filter(r => r.Program === pNum && String(r.Year).trim() === '1' && r.Barcode !== 'ABSENT' && r['Final Score'] && !isNaN(parseFloat(r['Final Score'])));
    valid.sort((a,b) => parseFloat(b['Final Score']) - parseFloat(a['Final Score']));
    return valid.length > 0 ? valid[0] : null;
  };

  const getHighestOverall = (pNum) => {
    const valid = allResults.filter(r => r.Program === pNum && r.Barcode !== 'ABSENT' && r['Final Score'] && !isNaN(parseFloat(r['Final Score'])));
    valid.sort((a,b) => parseFloat(b['Final Score']) - parseFloat(a['Final Score']));
    return valid.length > 0 ? valid[0] : null;
  };

  const categoryAwards5 = useMemo(() => ({
    best1: getBestFirstYear('5'),
    highest: getHighestOverall('5')
  }), [allResults]);

  const categoryAwards3 = useMemo(() => ({
    best1: getBestFirstYear('3'),
    highest: getHighestOverall('3')
  }), [allResults]);

  const handleSearch = () => {
    setErrorMsg('');
    setSearchedResult(null);
    if (!rollNumber.trim()) {
        setErrorMsg('Please enter a valid Roll Number.');
        return;
    }
    
    // Find the student
    const student = allResults.find(r => r.RollNumber?.toUpperCase() === rollNumber.trim().toUpperCase());
    
    if (!student) {
        setErrorMsg('Roll Number not found in official results.');
        return;
    }

    const selectedProgramNum = activeProgram.startsWith('5') ? '5' : '3';
    
    if (student.Program !== selectedProgramNum) {
        setErrorMsg(`Invalid Selection: Roll Number belongs to the ${student.Program}-Year Program.`);
        return;
    }

    if (String(student.Year).trim() !== String(activeYear).trim()) {
        setErrorMsg(`Invalid Selection: Roll Number is registered under Year ${student.Year}.`);
        return;
    }

    // Process ranks (excluding ABSENT students from competitive rankings calculation)
    const validStudents = allResults.filter(r => r['Final Score'] !== undefined && r['Final Score'] !== '' && !isNaN(parseFloat(r['Final Score'])));
    const programStudents = validStudents.filter(r => r.Program === student.Program);
    const yearStudents = programStudents.filter(r => r.Year === student.Year);

    const getRank = (list, stu) => {
        if (stu.Barcode === 'ABSENT' || !stu['Final Score']) return 'N/A';
        let rank = 1;
        const myScore = parseFloat(stu['Final Score']) || 0;
        for (let i = 0; i < list.length; i++) {
             const theirScore = parseFloat(list[i]['Final Score']) || 0;
             if (theirScore > myScore) {
                 rank++;
             }
        }
        return rank;
    }

    const prgRank = getRank(programStudents, student);
    const yrRank = getRank(yearStudents, student);

    setSearchedResult({
       ...student,
       programRank: prgRank,
       yearRank: yrRank,
       totalStudentsInProgram: programStudents.length,
       totalStudentsInYear: yearStudents.length
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearchedResult(null);
    setRollNumber('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const renderHome = () => (
    <>
      <div style={{ backgroundColor: 'white', width: '100%', position: 'relative' }}>
        <section className="container relative hero-section" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
          <div className="bg-stripes"></div>
          <div className="hero-layout relative z-10">
            <div className="lg:pr-12">
              <div className="flex items-center gap-4 mb-6">
                <div style={{ height: '1px', backgroundColor: '#c39b62', width: '2rem' }}></div>
                <span className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: '#c39b62' }}>Results - Session 2026</span>
              </div>
              <h1 className="responsive-title font-serif text-navy mb-6 leading-tight">
                Announcing the <br/><span className="text-gold italic">Legal Olympiad</span> 2026<br/>results
              </h1>
              <p className="text-muted text-base lg:text-lg lg:max-w-xl lg:pr-8 mt-6">
                Conducted on 28 March 2026 across participating universities. Students may access their individual standing, view category awards, and review the honour roll below.
              </p>
            </div>
            <div className="exam-stats-box">
              <div className="stat-box-inner" style={{ padding: '1.25rem 2rem', borderRight: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: '0.75rem', fontWeight: 'bold' }}>Exam Date</div>
                <div className="font-serif text-navy pt-1" style={{ fontSize: '15px', lineHeight: '1.3' }}>28 Mar<br />2026</div>
              </div>
              <div className="stat-box-inner" style={{ padding: '1.25rem 2rem', borderRight: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: '0.75rem', fontWeight: 'bold' }}>Questions</div>
                <div className="font-serif text-navy pt-2" style={{ fontSize: '15px' }}>80</div>
              </div>
              <div className="stat-box-inner" style={{ padding: '1.25rem 2rem', borderRight: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: '0.75rem', fontWeight: 'bold' }}>Programs</div>
                <div className="font-serif text-navy pt-2" style={{ fontSize: '15px' }}>3-Yr - 5-Yr</div>
              </div>
              <div className="stat-box-inner" style={{ padding: '1.25rem 2rem' }}>
                <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: '0.75rem', fontWeight: 'bold' }}>Published</div>
                <div className="font-serif text-navy pt-1" style={{ fontSize: '15px', lineHeight: '1.3' }}>17 Apr<br />2026</div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <section id="lookup" className="border-t relative z-20" style={{ backgroundColor: '#FAF8F3', paddingTop: '6rem', paddingBottom: '7rem' }}>
        <div className="container">
          <div className="flex justify-between items-end mb-6 border-b border-slate-200 section-header" style={{ paddingBottom: '3rem' }}>
            <div>
              <h2 className="responsive-title-serif font-serif text-navy mb-4" style={{ fontSize: '38px' }}>Access your result</h2>
              <p className="text-muted text-[13px] lg:max-w-2xl" style={{ lineHeight: '1.8' }}>Select your program and current year, then enter your roll number to view your<br />official ranking and any category awards.</p>
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#b28e53', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '4px' }}>
              <span className="font-serif">§</span> 01 / <span className="ml-1">LOOKUP</span>
            </div>
          </div>

          <div className="grid-2 pt-12">
            <div className="border p-8 lg:p-10 bg-white shadow-sm">
              <h3 className="font-serif text-navy text-xl mb-2">Student verification</h3>
              <p className="text-sm text-muted mb-8">Your roll number acts as your access key. Information is read-only.</p>
              
              <div className="mb-8">
                <label className="block text-[9px] items-center font-bold tracking-[0.2em] uppercase text-muted mb-3">Program</label>
                <div className="form-toggle">
                  <button className={`form-toggle-btn ${activeProgram === '3-Year Program' ? 'active' : ''}`} onClick={() => setActiveProgram('3-Year Program')}>3-Year Program</button>
                  <button className={`form-toggle-btn ${activeProgram === '5-Year Program' ? 'active' : ''}`} onClick={() => setActiveProgram('5-Year Program')}>5-Year Program</button>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-muted mb-3">Current Year of Study</label>
                <div className="year-grid">
                  {[1,2,3,4,5].map(year => (
                    <button key={year} className={`year-btn ${activeYear === year ? 'active' : ''}`} onClick={() => setActiveYear(year)}>Year {year}</button>
                  ))}
                </div>
              </div>

              <div className="mb-8 relative">
                <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-muted mb-3">Roll Number</label>
                <input 
                   type="text" 
                   placeholder="e.g. LO10023" 
                   className={`input-field py-3 px-4 bg-[#f8fbff] focus:bg-white transition-colors ${errorMsg ? 'border-red-400' : ''}`}
                   value={rollNumber}
                   onChange={(e) => setRollNumber(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {errorMsg && <div className="text-red-500 text-[11px] mt-2 font-medium flex items-center gap-1.5"><AlertCircle size={12}/> {errorMsg}</div>}
              </div>

              <button className="btn-primary py-3.5 font-bold text-[13px] tracking-wide" onClick={handleSearch}>
                View official result <ArrowRight size={16} className="ml-2" />
              </button>
            </div>

            <div className="lg:pl-10">
              <h3 className="font-serif text-navy" style={{ fontSize: '19px', fontWeight: '500', marginBottom: '2.5rem' }}>How your rank is determined</h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #e8e8e8' }}>
                  <div className="font-serif italic text-gold" style={{ minWidth: '28px', fontSize: '1.1rem', marginTop: '2px' }}>i.</div>
                  <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#555' }}>
                    <strong style={{ color: '#091c33', fontWeight: '700', marginRight: '4px' }}>Year-wise Rank</strong>
                    places you within your own year-of-study cohort and program. This is your primary standing.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', padding: '1.25rem 0', borderBottom: '1px solid #e8e8e8' }}>
                  <div className="font-serif italic text-gold" style={{ minWidth: '28px', fontSize: '1.1rem', marginTop: '2px' }}>ii.</div>
                  <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#555' }}>
                    <strong style={{ color: '#091c33', fontWeight: '700', marginRight: '4px' }}>Overall Program Rank</strong>
                    reflects your position across all years within your program.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', padding: '1.25rem 0', borderBottom: '1px solid #e8e8e8' }}>
                  <div className="font-serif italic text-gold" style={{ minWidth: '28px', fontSize: '1.1rem', marginTop: '2px' }}>iii.</div>
                  <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#555' }}>
                    <strong style={{ color: '#091c33', fontWeight: '700', marginRight: '4px' }}>Category Awards</strong>
                    are conferred for specific distinctions, such as Best First Year Performance and Highest Overall Score.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '1.25rem' }}>
                  <div className="font-serif italic text-gold" style={{ minWidth: '28px', fontSize: '1.1rem', marginTop: '2px' }}>iv.</div>
                  <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#555' }}>
                    <strong style={{ color: '#091c33', fontWeight: '700', marginRight: '4px' }}>Tied scores</strong>
                    receive the same rank in keeping with standard competitive practice.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="honour-roll" className="bg-bg-cream border-t border-slate-200 relative z-10" style={{ paddingTop: '7rem', paddingBottom: '6rem' }}>
        <div className="container">
          <div className="flex justify-between items-end mb-6 border-b border-slate-200 section-header" style={{ paddingBottom: '3rem' }}>
            <div>
              <h2 className="responsive-title-serif font-serif text-navy mb-4" style={{ fontSize: '38px' }}>
                Honour roll <span className="text-slate-400 font-light">·</span> top three
              </h2>
              <p className="text-muted text-[13px] lg:max-w-2xl" style={{ lineHeight: '1.8' }}>Overall top three rankings from each program, determined by Final Score<br />across all years of the respective program.</p>
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#b28e53', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '4px', whiteSpace: 'nowrap' }}>
              <span className="font-serif">§</span> 02 / RANKINGS
            </div>
          </div>

          <div className="program-tab" style={{ marginBottom: '2rem' }}>
            <button 
              className={`tab-btn ${activeHonourProgram === '5-Year Program' ? 'active' : ''}`}
              onClick={() => setActiveHonourProgram('5-Year Program')}
            >
              5-Year Program
            </button>
            <button 
              className={`tab-btn ${activeHonourProgram === '3-Year Program' ? 'active' : ''}`}
              onClick={() => setActiveHonourProgram('3-Year Program')}
            >
              3-Year Program
            </button>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb' }}>
            {honourRollStudents.map((student, idx) => (
              <div key={idx} className="honour-row" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.75rem 2rem',
                borderBottom: idx < honourRollStudents.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: '60px' }}>
                    <span className="font-serif italic text-gold" style={{ fontSize: '1rem', marginTop: '6px', marginRight: '2px' }}>Nº</span>
                    <span className="honour-rank-num font-serif text-navy" style={{ fontSize: '3rem', lineHeight: 1, fontWeight: '700' }}>0{student.displayRank}</span>
                  </div>
                  <div className="honour-info">
                    <div className="font-serif font-bold text-navy honour-name" style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{student.Name}</div>
                    <div className="honour-college" style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{student.College}</div>
                    <div style={{ fontSize: '9px', color: '#b28e53', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{student.RollNumber}</div>
                  </div>
                </div>
                <div className="honour-badge" style={{
                  border: student.displayRank === 1 ? '1px solid #b28e53' : '1px solid #9ca3af',
                  color: student.displayRank === 1 ? '#b28e53' : '#9ca3af',
                  padding: '0.3rem 0.75rem',
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {student.displayRank === 1 ? 'First Place' : student.displayRank === 2 ? 'Second Place' : 'Third Place'}
                </div>
              </div>
            ))}
            {honourRollStudents.length === 0 && (
              <div style={{ padding: '2rem', color: '#9ca3af' }}>No honour roll data found for this program.</div>
            )}
          </div>
        </div>
      </section>

      <section id="awards" className="bg-bg-cream" style={{ paddingTop: '5rem', paddingBottom: '8rem' }}>
        <div className="container">
          <div className="flex justify-between items-end mb-10 border-b border-slate-200 section-header" style={{ paddingBottom: '3rem' }}>
            <div>
              <h2 className="responsive-title-serif font-serif text-navy mb-4" style={{ fontSize: '38px' }}>Category awards</h2>
              <p className="text-muted text-[13px] lg:max-w-2xl" style={{ lineHeight: '1.8' }}>Distinctions conferred for performance within defined categories. Awarded per<br />program.</p>
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#b28e53', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '4px', whiteSpace: 'nowrap' }}>
              <span className="font-serif">§</span> 03 / AWARDS
            </div>
          </div>

          <div className="categories-layout" style={{ marginTop: '4rem' }}>
            {/* 5-Year Program */}
            <div>
              <h3 className="font-serif text-navy pb-4 mb-6" style={{ fontSize: '1.25rem', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>
                5-Year <span className="italic font-normal" style={{ color: '#b28e53' }}>Program</span>
              </h3>

              {/* Category I */}
              <div style={{ border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#091c33', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-serif font-bold text-white" style={{ fontSize: '16px' }}>Best First Year Performance</span>
                  <span style={{ fontSize: '8px', letterSpacing: '0.2em', color: '#b28e53', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Category I</span>
                </div>
                <div style={{ backgroundColor: 'white', padding: '0.5rem 1.5rem' }}>
                  {categoryAwards5.best1 ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '1rem 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#b28e53', fontSize: '12px', marginTop: '3px', flexShrink: 0 }}>✦</span>
                      <div>
                        <div className="font-serif font-bold text-navy" style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{categoryAwards5.best1.Name}</div>
                        <div style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{categoryAwards5.best1.RollNumber} · {categoryAwards5.best1.College}</div>
                      </div>
                    </div>
                  ) : <div style={{ padding: '1rem 0', fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>Not Awarded</div>}
                </div>
              </div>

              {/* Category II */}
              <div style={{ border: '1px solid #e5e7eb' }}>
                <div style={{ backgroundColor: '#091c33', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-serif font-bold text-white" style={{ fontSize: '16px' }}>Highest Overall Score</span>
                  <span style={{ fontSize: '8px', letterSpacing: '0.2em', color: '#b28e53', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Category II</span>
                </div>
                <div style={{ backgroundColor: 'white', padding: '0.5rem 1.5rem' }}>
                  {categoryAwards5.highest ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '1rem 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#b28e53', fontSize: '12px', marginTop: '3px', flexShrink: 0 }}>✦</span>
                      <div>
                        <div className="font-serif font-bold text-navy" style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{categoryAwards5.highest.Name}</div>
                        <div style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{categoryAwards5.highest.RollNumber} · {categoryAwards5.highest.College}</div>
                      </div>
                    </div>
                  ) : <div style={{ padding: '1rem 0', fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>Not Awarded</div>}
                </div>
              </div>
            </div>

            {/* 3-Year Program */}
            <div>
              <h3 className="font-serif text-navy pb-4 mb-6" style={{ fontSize: '1.25rem', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>
                3-Year <span className="italic font-normal" style={{ color: '#b28e53' }}>Program</span>
              </h3>

              {/* Category I */}
              <div style={{ border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#091c33', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-serif font-bold text-white" style={{ fontSize: '16px' }}>Best First Year Performance</span>
                  <span style={{ fontSize: '8px', letterSpacing: '0.2em', color: '#b28e53', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Category I</span>
                </div>
                <div style={{ backgroundColor: 'white', padding: '0.5rem 1.5rem' }}>
                  {categoryAwards3.best1 ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '1rem 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#b28e53', fontSize: '12px', marginTop: '3px', flexShrink: 0 }}>✦</span>
                      <div>
                        <div className="font-serif font-bold text-navy" style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{categoryAwards3.best1.Name}</div>
                        <div style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{categoryAwards3.best1.RollNumber} · {categoryAwards3.best1.College}</div>
                      </div>
                    </div>
                  ) : <div style={{ padding: '1rem 0', fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>Not Awarded</div>}
                </div>
              </div>

              {/* Category II */}
              <div style={{ border: '1px solid #e5e7eb' }}>
                <div style={{ backgroundColor: '#091c33', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-serif font-bold text-white" style={{ fontSize: '16px' }}>Highest Overall Score</span>
                  <span style={{ fontSize: '8px', letterSpacing: '0.2em', color: '#b28e53', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Category II</span>
                </div>
                <div style={{ backgroundColor: 'white', padding: '0.5rem 1.5rem' }}>
                  {categoryAwards3.highest ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '1rem 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#b28e53', fontSize: '12px', marginTop: '3px', flexShrink: 0 }}>✦</span>
                      <div>
                        <div className="font-serif font-bold text-navy" style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{categoryAwards3.highest.Name}</div>
                        <div style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{categoryAwards3.highest.RollNumber} · {categoryAwards3.highest.College}</div>
                      </div>
                    </div>
                  ) : <div style={{ padding: '1rem 0', fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>Not Awarded</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="note-box bg-white shadow-sm" style={{ marginTop: '3rem', marginBottom: '6rem' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c39b62', fontWeight: 'bold', whiteSpace: 'nowrap', minWidth: '150px', marginTop: '6px', marginLeft: '8px' }}>
              Note on<br />Highest Overall Score
            </div>
            <div className="text-[12px] text-muted leading-[1.8] mt-1 lg:pr-6 pb-2">
              This distinction compares students across different years of study who may have covered different portions of the syllabus. It reflects performance on this specific examination only, and should not be read as an indicator of overall academic standing. Year-wise rankings offer a more comparable measure within a single cohort.
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const renderResultPage = () => {
    return (
      <div className="container py-16 min-h-[70vh] animate-in fade-in duration-500 relative">
        <button 
          onClick={clearSearch} 
          className="back-btn"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#091c33',
            color: 'white',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontWeight: 'bold',
            borderRadius: '2px',
            marginBottom: '3rem',
            transition: 'all 0.2s',
            border: 'none'
          }}
        >
          <ArrowLeft size={16} /> Back to Official Portal
        </button>
        
        <div className="result-card-container">
             
             {/* Header */}
             <div style={{ marginBottom: '2rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                     <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>{searchedResult.RollNumber} • OVERALL STANDING</div>
                     <div style={{ fontSize: '9px', color: '#091c33', backgroundColor: '#fcfcfc', border: '1px solid #e5e7eb', padding: '0.25rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginLeft: '1rem' }}>Official Result</div>
                 </div>
                 <h1 className="font-serif result-name" style={{ color: '#091c33', fontWeight: 'bold', marginBottom: '1rem', lineHeight: '1.2' }}>{searchedResult.Name}</h1>
                 <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '11px', color: '#091c33', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: '#f5f6f8', padding: '0.4rem 0.75rem' }}>{searchedResult.College}</span>
                    <span style={{ fontSize: '11px', color: '#777', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>Year {searchedResult.Year} ({searchedResult.Program}-Yr)</span>
                 </div>
             </div>

             {/* Final Score and Stats Blocks */}
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
                 {/* Final Score */}
                 <div className="final-score-box">
                     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                         <div style={{ fontSize: '11px', color: '#091c33', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Final Objective Score</div>
                         <div style={{ flex: 1, height: '1px', backgroundColor: '#e8e3d8' }}></div>
                     </div>
                     <div className="font-serif" style={{ color: '#091c33', fontSize: '4.5rem', lineHeight: 1, fontWeight: 'bold', marginBottom: '1.5rem' }}>{searchedResult['Final Score'] || '0'}</div>
                     <div style={{ fontSize: '11px', color: '#091c33', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                         [ Status: {searchedResult.Barcode === 'ABSENT' ? 'ABSENT' : 'EVALUATED'} ]
                     </div>
                 </div>

                 {/* Summary Stats */}
                 <div style={{ flex: '1 1 250px', backgroundColor: '#f4f5f5', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1.5rem 1rem 1rem', position: 'relative', marginTop: '0.75rem' }}>
                     <div style={{ position: 'absolute', top: '-12px', left: '16px', backgroundColor: '#233142', color: 'white', fontSize: '9px', padding: '0.3rem 0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                         Summary Statistics
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div style={{ backgroundColor: 'white', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f3f4f6', borderRadius: '2px' }}>
                           <span style={{ fontSize: '10px', color: '#091c33', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Correct</span>
                           <span className="font-serif" style={{ color: '#091c33', fontSize: '1.5rem', fontWeight: 'bold' }}>{searchedResult['Total Correct'] || 0}</span>
                        </div>
                        <div style={{ backgroundColor: 'white', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f3f4f6', borderRadius: '2px' }}>
                           <span style={{ fontSize: '10px', color: '#091c33', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Wrong</span>
                           <span className="font-serif" style={{ color: '#091c33', fontSize: '1.5rem', fontWeight: 'bold' }}>{searchedResult['Total Wrong'] || 0}</span>
                        </div>
                        <div style={{ backgroundColor: 'white', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f3f4f6', borderRadius: '2px' }}>
                           <span style={{ fontSize: '10px', color: '#091c33', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Blank</span>
                           <span className="font-serif" style={{ color: '#091c33', fontSize: '1.5rem', fontWeight: 'bold' }}>{searchedResult['Total Blank'] || 0}</span>
                        </div>
                     </div>
                 </div>
             </div>

             {/* Program Details Layer */}
             <div style={{ backgroundColor: '#faf9f5', border: '1px solid #e8e3d8', padding: '1.5rem', paddingTop: '2.5rem', position: 'relative', marginBottom: '1.5rem', borderRadius: '4px' }}>
                 <div style={{ position: 'absolute', top: '-14px', left: '16px', backgroundColor: '#b28e53', color: 'white', fontFamily: 'var(--font-serif)', fontSize: '15px', padding: '0.25rem 1.25rem', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                     Program Details
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                     <div className="mobile-stack" style={{ backgroundColor: 'white', border: '1px solid #f3f4f6', padding: '1.25rem', borderRadius: '4px', alignItems: 'flex-start' }}>
                         <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
                             <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Email Address</div>
                             <div style={{ color: '#091c33', fontSize: '13px', fontWeight: 'bold', wordBreak: 'break-all', overflowWrap: 'break-word' }}>{searchedResult.Email}</div>
                         </div>
                         <div style={{ textAlign: 'center', minWidth: '60px' }}>
                             <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Year</div>
                             <div className="font-serif" style={{ color: '#091c33', fontSize: '2rem', fontWeight: 'bold' }}>{searchedResult.Year}</div>
                         </div>
                     </div>
                     <div style={{ backgroundColor: 'white', border: '1px solid #f3f4f6', padding: '1.25rem', borderRadius: '4px' }}>
                         <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>City & State</div>
                         <div style={{ color: '#091c33', fontSize: '13px', fontWeight: 'bold', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{searchedResult.City}, {searchedResult.State}</div>
                     </div>
                 </div>
             </div>

             {/* Applicant Details Layer */}
             <div style={{ border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '4px', marginBottom: '3rem' }}>
                 <h3 className="font-serif" style={{ color: '#091c33', fontSize: '17px', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>Applicant Details</h3>
                 <div className="app-details-grid">
                    <div style={{ overflow: 'hidden' }}>
                       <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Email Address</div>
                       <div style={{ color: '#091c33', fontSize: '12px', fontWeight: 'bold', wordBreak: 'break-all', overflowWrap: 'break-word' }} title={searchedResult.Email}>{searchedResult.Email}</div>
                    </div>
                    <div>
                       <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Registered Mobile</div>
                       <div style={{ color: '#091c33', fontSize: '12px', fontWeight: 'bold' }}>{searchedResult.Mobile}</div>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                       <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>City & State</div>
                       <div style={{ color: '#091c33', fontSize: '12px', fontWeight: 'bold', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{searchedResult.City}, {searchedResult.State}</div>
                    </div>
                    <div>
                       <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Identifiers</div>
                       <div style={{ color: '#091c33', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.6' }}>
                          <span style={{ opacity: 0.6, marginRight: '0.5rem' }}>Course Code</span> {searchedResult.CourseCode} <br/>
                          <span style={{ opacity: 0.6, marginRight: '0.5rem' }}>OMR Barcode</span> {searchedResult.Barcode !== '0' && searchedResult.Barcode !== 'ABSENT' ? searchedResult.Barcode : 'N/A'}
                       </div>
                    </div>
                 </div>
             </div>

             <div style={{ paddingTop: '0.5rem', backgroundColor: 'white' }}>
                <div className="font-serif" style={{ color: '#091c33', fontSize: '1.25rem', marginBottom: '2rem', borderLeft: '3px solid var(--gold)', paddingLeft: '1rem', letterSpacing: '0.05em', fontWeight: 'bold' }}>Detailed OMR Sheet Mapping</div>
             
             <div className="omr-grid" style={{ gap: '0.4rem' }}>
               {Array.from({length: 80}).map((_, i) => {
                 const qNum = i + 1;
                 const ansKey = `Ques ${qNum}`;
                 const ans = searchedResult?.[ansKey];
                 
                 let displayAns = ans;
                 let borderClass = "border-slate-200";
                 let bgClass = "bg-white";
                 let textClass = "text-navy";

                 if (!ans || String(ans).trim() === '0' || String(ans).trim() === '') {
                    displayAns = '−';
                    textClass = "text-muted opacity-40";
                    bgClass = "bg-slate-50";
                 } else if (String(ans).trim() === 'BONUS') {
                    displayAns = '★';
                    bgClass = "bg-gold";
                    borderClass = "border-gold";
                    textClass = "text-white";
                 }
                 
                 return (
                   <div key={qNum} className={`border ${borderClass} ${bgClass} py-3 text-center flex flex-col items-center justify-center rounded-sm transition-all hover:shadow-sm`}>
                     <div className={`text-[9px] uppercase font-bold tracking-widest mb-1 ${displayAns === '★' ? 'text-white/80' : 'text-slate-400'}`}>Q{qNum}</div>
                     <div className={`font-bold text-sm ${textClass}`}>{displayAns}</div>
                   </div>
                 );
               })}
             </div>
             <div className="mt-8 text-[11px] text-muted tracking-wide flex items-center gap-4 border-t pt-4">
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-white border inline-block"></span> Marked</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-50 border inline-block"></span> Unattempted</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-gold border border-gold inline-block"></span> Bonus Question</span>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans text-navy min-h-screen bg-bg-cream flex flex-col">
      {/* Top bar */}
      <nav className="bg-navy text-[9px] tracking-[0.2em] relative z-50 uppercase top-bar">
        <div className="container">
          <div className="flex justify-between items-center py-4 lg:py-5 top-bar-inner">
            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 top-bar-brand">
              <span className="font-bold text-white tracking-[0.25em]">Legal Olympiad</span>
              <div className="flex items-center gap-3">
                <span className="hidden lg:inline text-white/30 font-light opacity-50">-</span>
                <span className="text-white tracking-[0.15em] opacity-90 top-bar-subtitle">Official Results Portal</span>
              </div>
            </div>

            {/* Desktop Navigation links */}
            <div className="hidden sm:flex items-center gap-10 lg:gap-16 top-bar-desktop-nav">
              <a href="#lookup" className="text-white hover:text-white transition-colors duration-200 text-[10px] lg:text-[11px] font-bold">My Result</a>
              <a href="#honour-roll" className="text-white hover:text-white transition-colors duration-200 text-[10px] lg:text-[11px] font-bold">Hall of Fame</a>
              <a href="#awards" className="text-white hover:text-white transition-colors duration-200 text-[10px] lg:text-[11px] font-bold">Awards</a>
            </div>

            {/* Mobile Hamburger Button */}
            <button 
              className="sm:hidden text-white p-1 -mr-1 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        <div className={`sm:hidden bg-[#061324] transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="container py-4 flex flex-row items-center justify-center gap-10">
            <a href="#lookup" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link text-white hover:text-white transition-colors font-bold uppercase whitespace-nowrap">My Result</a>
            <a href="#honour-roll" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link text-white hover:text-white transition-colors font-bold uppercase whitespace-nowrap">Hall of Fame</a>
            <a href="#awards" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link text-white hover:text-white transition-colors font-bold uppercase whitespace-nowrap">Awards</a>
          </div>
        </div>
      </nav>

      {/* Main header */}
      <header className="bg-white border-b py-5 sticky top-0 z-40 shadow-sm main-header">
        <div className="container flex justify-between items-center main-header-container">
          <div className="flex items-center gap-4 cursor-pointer header-logo-group" onClick={clearSearch}>
            <div className="bg-navy text-gold p-2 font-serif font-bold text-xl leading-none" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>LO</div>
            <div>
              <div className="font-serif text-navy text-[22px] leading-none mb-1 mt-0.5">Legal Olympiad</div>
              <div className="text-[9px] tracking-[0.2em] uppercase mt-1" style={{ color: '#9ca3af' }}>Examination 2026</div>
            </div>
          </div>
          <nav className="flex gap-8 text-sm font-medium header-nav">
            <a href="#" onClick={(e) => { e.preventDefault(); clearSearch(); }} className={`transition-colors ${!searchedResult ? "text-navy font-semibold relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-gold" : "text-muted hover:text-navy"}`}>Look up result</a>
            <a href="#" className="text-muted hover:text-navy transition-colors">Rankings</a>
            <a href="#" className="text-muted hover:text-navy transition-colors">Awards</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
         {searchedResult ? renderResultPage() : renderHome()}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#091c33', paddingTop: '4rem', paddingBottom: '3rem', marginTop: 'auto', position: 'relative', zIndex: 10 }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div className="footer-grid">
            
            {/* Left Column */}
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'white', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>
                  Legal Olympiad <span style={{ color: '#c39b62', fontStyle: 'italic' }}>2026</span>
              </div>
              <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.6', maxWidth: '420px' }}>
                The Legal Olympiad is an examination benchmarking legal aptitude and subject proficiency among students of 3-Year and 5-Year law programs across participating institutions.
              </p>
            </div>
            
            {/* Middle Column */}
            <div style={{ paddingLeft: '1rem' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c39b62', fontWeight: 'bold', marginBottom: '1.25rem' }}>Quick Links</div>
              <ul style={{ color: '#d1d5db', fontSize: '13px', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><a href="#" onClick={(e) => { e.preventDefault(); clearSearch(); }} style={{ color: '#d1d5db', textDecoration: 'none' }} className="hover:text-white transition-colors">Look up result</a></li>
                <li><a href="#" style={{ color: '#d1d5db', textDecoration: 'none' }} className="hover:text-white transition-colors">Hall of Fame</a></li>
                <li><a href="#" style={{ color: '#d1d5db', textDecoration: 'none' }} className="hover:text-white transition-colors">Awards</a></li>
              </ul>
            </div>

            {/* Right Column */}
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c39b62', fontWeight: 'bold', marginBottom: '1.25rem' }}>Administration</div>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '0.25rem' }}>Examination conducted</div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>28 March 2026</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '0.25rem' }}>Results published</div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>17 April 2026</div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div style={{ fontSize: '9px', color: '#7ea1c5', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 'bold' }}>© 2026 LEGAL OLYMPIAD - OFFICIAL RESULTS</div>
            <div style={{ fontSize: '9px', color: '#7ea1c5', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 'bold' }}>RESULTS ARE FINAL AND BINDING</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
