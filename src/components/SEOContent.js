export default function SEOContent({ tool }) {
  return (
    <>
      <div className="seo-section">
        <h2>How to Use This Calculator</h2>
        <p>{tool.howto}</p>
        <div className="formula-box">{tool.formula}</div>
        {tool.formulaVars && <div className="formula-vars">{tool.formulaVars}</div>}
      </div>
      {tool.seoContent && (
        <div className="seo-section" dangerouslySetInnerHTML={{ __html: tool.seoContent }} />
      )}
    </>
  );
}
