import { moneyKo, pct } from '../calc.js';

export default function ScenarioTable({ title, caption, rows, headLabel, getHeadValue, getHeadNote }) {
  return (
    <section className="panel scenario">
      <header className="scenario__head">
        <h3>{title}</h3>
        <p className="scenario__caption">{caption}</p>
      </header>
      <div className="scenario__scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{headLabel}</th>
              <th scope="col" className="num">권리가액</th>
              <th scope="col" className="num">분담금</th>
              <th scope="col" className="num">총투입금</th>
              <th scope="col" className="num">예상차익</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.isCurrent ? 'is-current' : ''}>
                <th scope="row">
                  <span className="measured">{getHeadValue(row)}</span>
                  {getHeadNote && <span className="scenario__note">{getHeadNote(row)}</span>}
                </th>
                <td className="num measured">{moneyKo(row.rights)}</td>
                <td className="num measured">{moneyKo(row.contribution)}</td>
                <td className="num measured">{moneyKo(row.invest)}</td>
                <td className={'num measured ' + (row.profit >= 0 ? 'is-ok' : 'is-bad')}>
                  {moneyKo(row.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
