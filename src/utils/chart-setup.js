// إعدادات جاهزة للرسم البياني (ألوان، خيارات، محاور).

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Filler
)

export default ChartJS