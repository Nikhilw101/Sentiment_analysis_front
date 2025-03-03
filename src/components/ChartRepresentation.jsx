import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import '../styles/ChartRepresentation.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function ChartRepresentation({ sentimentCounts }) {
  const data = {
    labels: Object.keys(sentimentCounts),
    datasets: [
      {
        label: 'Sentiment Distribution',
        data: Object.values(sentimentCounts),
        backgroundColor: [
          'rgba(40,167,69,0.6)',  // positive (green)
          'rgba(220,53,69,0.6)',  // negative (red)
          'rgba(108,117,125,0.6)'  // neutral (gray)
        ],
        borderColor: [
          'rgba(40,167,69,1)',
          'rgba(220,53,69,1)',
          'rgba(108,117,125,1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="chart-representation my-4">
      <h4 className="text-center">Sentiment Analysis Overview</h4>
      <Pie data={data} />
    </div>
  );
}

export default ChartRepresentation;
