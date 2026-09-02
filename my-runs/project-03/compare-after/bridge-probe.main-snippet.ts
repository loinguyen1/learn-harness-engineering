// --- TEMPORARY end-to-end probe (not part of the repair) ---
app.whenReady().then(() => {
  setTimeout(async () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (!w) { console.log('PROBE fail: no window'); app.exit(3); return; }
    const js = `(async () => {
      const kb = window.knowledgeBase;
      if (!kb) return 'BRIDGE DEAD';
      const doc = await kb.documents.import('/work/data/sample-documents/retrieval-plan.md');
      const list = await kb.documents.list();
      await kb.indexing.start();
      const st = await kb.indexing.status();
      const chunks = await kb.indexing.chunks(doc.id);
      const ans = await kb.qa.ask('How does retrieval and chunk search work?');
      return JSON.stringify({
        imported: doc.title, listed: list.length,
        indexStatus: st.indexStatus ?? st.status, chunks: chunks.length,
        citations: ans.citations.length, confidence: ans.confidence,
        firstCite: ans.citations[0] && ans.citations[0].documentTitle
      });
    })()`;
    try { console.log('PROBE:', await w.webContents.executeJavaScript(js)); app.exit(0); }
    catch (e) { console.log('PROBE threw:', String(e)); app.exit(1); }
  }, 6000);
});
