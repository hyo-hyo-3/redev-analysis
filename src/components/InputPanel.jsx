import Field from './Field.jsx';

export default function InputPanel({ zone, onChange }) {
  const set = (key) => (value) => onChange({ ...zone, [key]: value });

  return (
    <div className="input-panels">
      <section className="panel">
        <h3>구역 개요</h3>
        <div className="field">
          <label htmlFor="f-name">구역명</label>
          <div className="field__row">
            <input id="f-name" value={zone.name} placeholder="예: OO동 OO구역" onChange={(e) => set('name')(e.target.value)} />
          </div>
          <p className="field__help" />
        </div>
        <div className="field">
          <label htmlFor="f-location">위치</label>
          <div className="field__row">
            <input id="f-location" value={zone.location} placeholder="예: 서울 OO구 OO동" onChange={(e) => set('location')(e.target.value)} />
          </div>
          <p className="field__help" />
        </div>
        <div className="field">
          <label htmlFor="f-stage">진행단계</label>
          <div className="field__row">
            <input id="f-stage" value={zone.stage} placeholder="예: 정비구역 지정 고시" onChange={(e) => set('stage')(e.target.value)} />
          </div>
          <p className="field__help" />
        </div>
        <div className="field">
          <label htmlFor="f-note">비고</label>
          <div className="field__row">
            <input id="f-note" value={zone.note} placeholder="참고할 기사, 고시번호 등" onChange={(e) => set('note')(e.target.value)} />
          </div>
          <p className="field__help" />
        </div>
      </section>

      <section className="panel">
        <h3>감정평가</h3>
        <Field
          id="f-official"
          label="공시가격 (공동주택가격)"
          unit="만원"
          value={zone.official}
          onChange={set('official')}
          help="국토교통부 부동산공시가격 알리미 기준"
        />
        <Field
          id="f-mult"
          label="감정평가 배율 (보정률)"
          unit="배"
          value={zone.mult}
          onChange={set('mult')}
          inputMode="decimal"
          help="공시가격 대비 감정평가액 배율. 구역·물건마다 다릅니다."
        />
        <Field
          id="f-appraisal"
          label="감정평가액 확정값 (선택)"
          unit="만원"
          value={zone.appraisal}
          onChange={set('appraisal')}
          placeholder="비워 두면 공시가격 × 배율로 추정"
        />
      </section>

      <section className="panel">
        <h3>분양·매입</h3>
        <Field id="f-rate" label="비례율" unit="%" value={zone.rate} onChange={set('rate')} inputMode="decimal" />
        <Field id="f-price" label="조합원 분양가" unit="만원" value={zone.price} onChange={set('price')} placeholder="희망 평형의 조합원 분양가" />
        <Field id="f-buy" label="매매가 (매입가)" unit="만원" value={zone.buy} onChange={set('buy')} placeholder="피 포함 매매가" />
        <Field id="f-etc" label="기타 비용" unit="만원" value={zone.etc} onChange={set('etc')} help="이주비 이자, 등기·중개비 등" />
      </section>

      <section className="panel">
        <h3>예상 시세</h3>
        <Field id="f-resale" label="입주 후 예상 시세" unit="만원" value={zone.resale} onChange={set('resale')} placeholder="인근 신축 시세 참고" />
        <Field id="f-years" label="예상 입주까지 기간" unit="년" value={zone.years} onChange={set('years')} />
      </section>
    </div>
  );
}
