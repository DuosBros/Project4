import React from 'react'
import FileSaver from 'file-saver';
import { exportDataToExcel } from '../utils/requests';
import { Icon, Dropdown } from 'semantic-ui-react'
import { pick, flattenObject } from '../utils/helpers';

const ExportDropdown = (props) => {

    const handleExport = (data) => {
        let dataToExport

        // for generic table
        if (props.columns && props.visibleColumnsList) {
            // only export visible and exportable columns
            let columnsToExport = props.columns
                .filter(c => c.exportable === true && props.visibleColumnsList.indexOf(c.prop) !== -1)
                .map(c => { return { label: c.name, key: c.prop } });
            dataToExport = pick(data, columnsToExport.map(x => x.key));
        }
        else {
            dataToExport = data
        }

        let flattenData = []
        if (props.needsToBeFlatten) {
            dataToExport.forEach(x => {
                flattenData.push(flattenObject(x))
            })

            dataToExport = flattenData;
        }

        const fileName = new Date().toISOString() + "_" + document.title
        exportDataToExcel(dataToExport, fileName, document.title).then((res) => {
            let blob = new Blob([res.data], { type: 'vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
            FileSaver.saveAs(blob, fileName + '.xlsx')
        })
        return;
    }

    return (
        <Dropdown onClick={() => handleExport(props.data)} direction={props.direction} style={props.style} icon={<Icon className="iconMargin" name='share' />} item text='Export'>
        </Dropdown>
    );
}

export default ExportDropdown;