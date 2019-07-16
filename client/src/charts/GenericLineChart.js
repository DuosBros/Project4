
import React from 'react';
import { Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CHART_COLORS } from '../appConfig';

// const CustomizedAxisTick = (props) => {
//     const { x, y, payload } = props;

//     let t = 'translate(' + x + 'px, ' + y + 'px)';
//     return (
//         <g transform={t}>
//             <text x={-5} y={-10} dy={16} textAnchor="end" fill="#666" transform="rotate(-90)">{payload.value}</text>
//         </g>
//     );
// };

const GenericLineChart = (props) => {
    let tooltip = <Tooltip />;
    if (props.tooltipFormatter) {
        tooltip = <Tooltip
            separator={props.tooltipFormatter.separator ? props.tooltipFormatter.separator : ": "}
            formatter={(value) => {
                return value + " " + (props.tooltipFormatter.formatter ? props.tooltipFormatter.formatter : "CZK")
            }} />
    }
    let data = props.data.slice()

    let line;
    if (props.ydataKey2) {
        line = <Line type="monotone" dataKey={props.ydataKey2 && props.ydataKey2} stroke={CHART_COLORS[1]} />
    }

    return (
        <ResponsiveContainer minHeight={props.longNames ? 500 : 300} minWidth={400} >
            <LineChart data={data} margin={{ top: 5, right: 50, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    // tick={props.longNames && <CustomizedAxisTick />}
                    height={props.longNames && 200}
                    dy={props.longNames && 60}
                    padding={{ left: 20, right: 20 }}
                    interval={props.data.length < 10 ? 0 : null}
                    angle={props.longNames && 90}
                    dataKey={props.xDataKey} />
                <YAxis />
                {tooltip}
                <Legend />
                <Line type="monotone" dataKey={props.ydataKey1 && props.ydataKey1} stroke={CHART_COLORS[0]} />
                {line}
            </LineChart>
        </ResponsiveContainer >
    );
}

export default GenericLineChart;