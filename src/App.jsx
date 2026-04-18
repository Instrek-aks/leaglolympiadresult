import React, { useState, useMemo } from 'react';
import { ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import csvData from '../Final_Result_17-04-2026.csv?raw';

export default function App() {
  const [activeProgram, setActiveProgram] = useState('3-Year Program');
  const [activeYear, setActiveYear] = useState(1);
  const [activeHonourProgram, setActiveHonourProgram] = useState('5-Year Program');
  
  const [rollNumber, setRollNumber] = useState('');
  const [searchedResult, setSearchedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

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
      <section className="container py-20 relative">
        <div className="bg-stripes"></div>
        <div className="hero-layout relative z-10">
          <div className="pr-12">
            <div className="flex items-center gap-4 mb-6">
              <div style={{ height: '2px', backgroundColor: '#c39b62', width: '2rem' }}></div>
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: '#c39b62' }}>Results - Opening 2026</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-serif text-navy mb-6 leading-tight">
              Announcing the <br/><span className="text-gold italic">Legal Olympiad</span> 2026<br/>results
            </h1>
            <p className="text-muted text-base lg:text-lg max-w-xl pr-8 mt-6">
              Conducted on 28 March 2026 across participating universities. Students may access their individual standing, view category awards, and review the honour roll below.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', backgroundColor: 'white', border: '1px solid #e5e7eb', marginTop: '2.5rem', alignSelf: 'start', height: 'fit-content' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 'bold' }}>Exam Date</div>
              <div className="font-serif text-navy pt-1" style={{ fontSize: '1.75rem', lineHeight: '1.2' }}>28 Mar<br />2026</div>
            </div>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 'bold' }}>Questions</div>
              <div className="font-serif text-navy pt-2" style={{ fontSize: '2rem' }}>80</div>
            </div>
            <div style={{ padding: '1.5rem 2rem', borderRight: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 'bold' }}>Programs</div>
              <div className="font-serif text-navy pt-2" style={{ fontSize: '1.5rem' }}>3-Yr - 5-Yr</div>
            </div>
            <div style={{ padding: '1.5rem 2rem' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 'bold' }}>Published</div>
              <div className="font-serif text-navy pt-1" style={{ fontSize: '1.5rem', lineHeight: '1.2' }}>17 Apr<br />2026</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-white pt-16 pb-24 relative z-20">
        <div className="container">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-serif text-navy mb-2">Access your result</h2>
              <p className="text-muted text-sm max-w-2xl">Select your program and current year, then enter your roll number to view your<br />official ranking and any category awards.</p>
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#b28e53', fontWeight: 'bold', textTransform: 'uppercase' }}>
              <span className="mr-2 opacity-60">↓ 01</span> / <span className="ml-2">Lookup</span>
            </div>
          </div>

          <div className="grid-2">
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

            <div className="pl-2 lg:pl-6 pt-2">
              <h3 className="text-lg font-serif text-navy mb-8">How your rank is determined</h3>
              <div className="rank-info-list space-y-7">
                <div className="rank-info-item flex gap-4">
                  <div style={{ color: '#b28e53', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.25rem', marginTop: '0.125rem' }}>i.</div>
                  <div className="text-[13px] leading-relaxed pr-8"><strong className="text-navy">Year-wise Rank</strong> places you within your own year-of-study cohort and program. This is your primary standing.</div>
                </div>
                <div className="rank-info-item flex gap-4">
                  <div style={{ color: '#b28e53', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.25rem', marginTop: '0.125rem' }}>ii.</div>
                  <div className="text-[13px] leading-relaxed pr-8"><strong className="text-navy">Overall Program Rank</strong> reflects your position across all years within your program.</div>
                </div>
                <div className="rank-info-item flex gap-4">
                  <div style={{ color: '#b28e53', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.25rem', marginTop: '0.125rem' }}>iii.</div>
                  <div className="text-[13px] leading-relaxed pr-8"><strong className="text-navy">Category Awards</strong> are conferred for specific distinctions, such as Best First Year Performance and Highest Overall Score.</div>
                </div>
                <div className="rank-info-item flex gap-4">
                  <div style={{ color: '#b28e53', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.25rem', marginTop: '0.125rem' }}>iv.</div>
                  <div className="text-[13px] leading-relaxed pr-8"><strong className="text-navy">Tied scores</strong> receive the same rank in keeping with standard competitive practice.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-cream py-20 border-t border-slate-200 relative z-10">
        <div className="container">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-serif text-navy mb-2">Honour roll - <span className="italic text-muted font-normal">top three</span></h2>
              <p className="text-muted text-sm max-w-xl">Overall top three rankings from each program, determined by Final Score<br />across all years of the respective program.</p>
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#b28e53', fontWeight: 'bold', textTransform: 'uppercase' }}>
              <span className="mr-2 opacity-60">↓ 02</span> / <span className="ml-2">Rankings</span>
            </div>
          </div>

          <div className="program-tab">
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

          <div className="honour-list shadow-sm">
            {honourRollStudents.map((student, idx) => (
              <div key={idx} className="honour-card">
                <div className="flex items-center gap-8">
                  <div className="honour-rank">
                    <span className="text-gold font-serif text-xl mr-1 mt-2">Nº</span>
                    <span className="honour-rank-no text-5xl">0{student.displayRank}</span>
                  </div>
                  <div>
                    <div className="font-serif font-bold text-xl text-navy">{student.Name}</div>
                    <div className="text-[10px] font-bold text-muted mt-2 uppercase tracking-[0.1em]">{student.College}</div>
                    <div className="text-[9px] font-bold text-gold mt-1 uppercase tracking-widest pl-0.5">{student.RollNumber}</div>
                  </div>
                </div>
                <div style={{ border: student.displayRank === 1 ? '1px solid #b28e53' : '1px solid #9ca3af', backgroundColor: 'transparent', color: student.displayRank === 1 ? '#b28e53' : '#9ca3af', padding: '0.3rem 0.6rem', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {student.displayRank === 1 ? 'First Place' : student.displayRank === 2 ? 'Second Place' : 'Third Place'}
                </div>
              </div>
            ))}
            {honourRollStudents.length === 0 && (
              <div className="p-8 text-muted">No honour roll data found for this program.</div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-bg-cream pb-32">
        <div className="container">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-serif text-navy mb-3">Category awards</h2>
              <p className="text-muted text-sm pr-12">Distinctions conferred for performance within defined categories. Awarded per<br />program.</p>
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#b28e53', fontWeight: 'bold', textTransform: 'uppercase' }}>
              <span className="mr-2 opacity-60">↓ 03</span> / <span className="ml-2">Awards</span>
            </div>
          </div>

          <div className="categories-layout">
            <div>
              <h3 className="font-serif text-[22px] font-bold text-navy mb-6">5-Year <span className="italic text-gold font-normal">Program</span></h3>
              
              <div className="category-box shadow-sm">
                <div className="category-header">
                  <span className="font-serif font-bold text-[17px] tracking-wide">Best First Year Performance</span>
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gold mt-0.5">Category I</span>
                </div>
                <div className="category-body py-8 px-6">
                  {categoryAwards5.best1 ? (
                    <div className="student-item">
                      <span className="diamond-bullet">◆</span>
                      <div>
                        <div className="font-serif font-bold text-navy text-xl">{categoryAwards5.best1.Name}</div>
                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">{categoryAwards5.best1.RollNumber} - {categoryAwards5.best1.College}</div>
                      </div>
                    </div>
                  ) : <div className="text-muted text-[13px] italic">Not Awarded</div>}
                </div>
              </div>

              <div className="category-box shadow-sm mt-8">
                <div className="category-header">
                  <span className="font-serif font-bold text-[17px] tracking-wide">Highest Overall Score</span>
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gold mt-0.5">Category II</span>
                </div>
                <div className="category-body py-8 px-6">
                  {categoryAwards5.highest ? (
                    <div className="student-item">
                      <span className="diamond-bullet">◆</span>
                      <div>
                        <div className="font-serif font-bold text-navy text-xl">{categoryAwards5.highest.Name}</div>
                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">{categoryAwards5.highest.RollNumber} - {categoryAwards5.highest.College}</div>
                      </div>
                    </div>
                  ) : <div className="text-muted text-[13px] italic">Not Awarded</div>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-serif text-[22px] font-bold text-navy mb-6">3-Year <span className="italic text-gold font-normal">Program</span></h3>
              
              <div className="category-box shadow-sm">
                <div className="category-header">
                  <span className="font-serif font-bold text-[17px] tracking-wide">Best First Year Performance</span>
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gold mt-0.5">Category I</span>
                </div>
                <div className="category-body py-8 px-6">
                  {categoryAwards3.best1 ? (
                    <div className="student-item">
                      <span className="diamond-bullet">◆</span>
                      <div>
                        <div className="font-serif font-bold text-navy text-xl">{categoryAwards3.best1.Name}</div>
                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">{categoryAwards3.best1.RollNumber} - {categoryAwards3.best1.College}</div>
                      </div>
                    </div>
                  ) : <div className="text-muted text-[13px] italic">Not Awarded</div>}
                </div>
              </div>

              <div className="category-box shadow-sm mt-8">
                <div className="category-header">
                  <span className="font-serif font-bold text-[17px] tracking-wide">Highest Overall Score</span>
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gold mt-0.5">Category II</span>
                </div>
                <div className="category-body py-8 px-6">
                  {categoryAwards3.highest ? (
                    <div className="student-item">
                      <span className="diamond-bullet">◆</span>
                      <div>
                        <div className="font-serif font-bold text-navy text-xl">{categoryAwards3.highest.Name}</div>
                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">{categoryAwards3.highest.RollNumber} - {categoryAwards3.highest.College}</div>
                      </div>
                    </div>
                  ) : <div className="text-muted text-[13px] italic">Not Awarded</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="note-box bg-white shadow-sm" style={{ marginTop: '3rem', marginBottom: '6rem' }}>
            <div className="text-[9px] tracking-[0.2em] uppercase text-[#c39b62] font-bold whitespace-nowrap min-w-[150px] mt-1.5 ml-2">
              Note on<br />Highest Overall Score
            </div>
            <div className="text-[12px] text-muted leading-[1.8] mt-1 pr-6 pb-2">
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
        <button onClick={clearSearch} className="mb-10 text-[11px] text-[#c39b62] uppercase tracking-[0.2em] font-bold hover:text-navy transition-colors flex items-center">
           <ArrowLeft size={16} className="mr-3" /> Back to Official Portal
        </button>
        
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', padding: '3rem', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', maxWidth: '100%', boxSizing: 'border-box' }}>
             
             {/* Header */}
             <div style={{ marginBottom: '2rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                     <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>{searchedResult.RollNumber} • OVERALL STANDING</div>
                     <div style={{ fontSize: '9px', color: '#091c33', backgroundColor: '#fcfcfc', border: '1px solid #e5e7eb', padding: '0.25rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginLeft: '1rem' }}>Official Result</div>
                 </div>
                 <h1 className="font-serif" style={{ color: '#091c33', fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', lineHeight: '1.2' }}>{searchedResult.Name}</h1>
                 <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '11px', color: '#091c33', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: '#f5f6f8', padding: '0.4rem 0.75rem' }}>{searchedResult.College}</span>
                    <span style={{ fontSize: '11px', color: '#777', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>Year {searchedResult.Year} ({searchedResult.Program}-Yr)</span>
                 </div>
             </div>

             {/* Final Score and Stats Blocks */}
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
                 {/* Final Score */}
                 <div style={{ flex: '1.5 1 400px', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1.5rem 2rem' }}>
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
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                     <div style={{ backgroundColor: 'white', border: '1px solid #f3f4f6', padding: '1.25rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                         <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
                             <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Email Address</div>
                             <div style={{ color: '#091c33', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{searchedResult.Email}</div>
                         </div>
                         <div style={{ textAlign: 'center', minWidth: '60px' }}>
                             <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Year</div>
                             <div className="font-serif" style={{ color: '#091c33', fontSize: '2rem', fontWeight: 'bold' }}>{searchedResult.Year}</div>
                         </div>
                     </div>
                     <div style={{ backgroundColor: 'white', border: '1px solid #f3f4f6', padding: '1.25rem', borderRadius: '4px' }}>
                         <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>City & State</div>
                         <div style={{ color: '#091c33', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{searchedResult.City}, {searchedResult.State}</div>
                     </div>
                 </div>
             </div>

             {/* Applicant Details Layer */}
             <div style={{ border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '4px', marginBottom: '3rem' }}>
                 <h3 className="font-serif" style={{ color: '#091c33', fontSize: '17px', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>Applicant Details</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ overflow: 'hidden' }}>
                       <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Email Address</div>
                       <div style={{ color: '#091c33', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={searchedResult.Email}>{searchedResult.Email}</div>
                    </div>
                    <div>
                       <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Registered Mobile</div>
                       <div style={{ color: '#091c33', fontSize: '12px', fontWeight: 'bold' }}>{searchedResult.Mobile}</div>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                       <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>City & State</div>
                       <div style={{ color: '#091c33', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{searchedResult.City}, {searchedResult.State}</div>
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
             
             <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10" style={{ gap: '0.5rem' }}>
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
      <div className="bg-navy text-white text-[10px] tracking-widest font-bold uppercase px-6 py-2.5 flex justify-between items-center relative z-50">
        <div>Legal Olympiad - Official Results Portal</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-gold transition-colors">My Result</a>
          <a href="#" className="hover:text-gold transition-colors">Hall of Fame</a>
          <a href="#" className="hover:text-gold transition-colors">Awards</a>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b px-6 py-5 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={clearSearch}>
          <div className="bg-navy text-gold p-2 font-serif font-bold text-xl leading-none">LO</div>
          <div>
            <div className="font-serif italic text-navy text-xl leading-none mb-1">Legal Olympiad</div>
            <div className="text-[9px] text-muted tracking-[0.2em] font-bold uppercase mt-1">Examination 2026</div>
          </div>
        </div>
        <nav className="flex gap-8 text-sm font-medium">
          <a href="#" onClick={(e) => { e.preventDefault(); clearSearch(); }} className={`transition-colors ${!searchedResult ? "text-navy font-semibold relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-gold" : "text-muted hover:text-navy"}`}>Look up result</a>
          <a href="#" className="text-muted hover:text-navy transition-colors">Rankings</a>
          <a href="#" className="text-muted hover:text-navy transition-colors">Awards</a>
        </nav>
      </header>

      <main className="flex-1">
         {searchedResult ? renderResultPage() : renderHome()}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#091c33', paddingTop: '4rem', paddingBottom: '3rem', marginTop: 'auto', position: 'relative', zIndex: 10 }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
            
            {/* Left Column */}
            <div style={{ gridColumn: 'span 2', paddingRight: '2rem' }}>
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

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '9px', color: '#7ea1c5', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 'bold' }}>© 2026 LEGAL OLYMPIAD - OFFICIAL RESULTS</div>
            <div style={{ fontSize: '9px', color: '#7ea1c5', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 'bold' }}>RESULTS ARE FINAL AND BINDING</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
