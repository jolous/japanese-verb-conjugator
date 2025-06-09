import React from 'react';

function RulesModal({ onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h3 className="highlight">How to conjugate Japanese verbs into ta-form and te-form.</h3>
        <table>
          <thead>
            <tr>
              <th>Ending</th>
              <th>Ta-form</th>
              <th>Te-form</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>う・つ・る</td>
              <td>った</td>
              <td>って</td>
            </tr>
            <tr>
              <td>む・ぬ・ぶ</td>
              <td>んだ</td>
              <td>んで</td>
            </tr>
            <tr>
              <td>く</td>
              <td>いた</td>
              <td>いて</td>
            </tr>
            <tr>
              <td>ぐ</td>
              <td>いだ</td>
              <td>いで</td>
            </tr>
            <tr>
              <td>す</td>
              <td>した</td>
              <td>して</td>
            </tr>
          </tbody>
        </table>
        <p className="exception">*Exception: いく → いった</p>
      </div>
    </div>
  );
}

export default RulesModal;
