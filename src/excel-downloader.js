import {Component} from 'react'
import XLSX from 'xlsx'

class ExcelDownloader extends Component {
  handleExcelDownload = ({sheetName = "Table Export", fileName = "Export.xls"}) => {
    const { data, columns } = this.props;
    const exportedData = data.map(item => {
      return Object.values(item)
    })

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(
      [columns.map(r => r.title)].concat(exportedData.map(r => r))
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName, { compression: true });
  }

  render() {
    const {children} = this.props
    return children({handleExcelDownload: this.handleExcelDownload})
  }
}

export default ExcelDownloader
