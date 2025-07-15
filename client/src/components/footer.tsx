import { ExternalLink, Github } from 'lucide-react';
import React from 'react';

const Footer: React.FC = () => {
    return (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <a
                        href="https://github.com/Sandeep-Petwal/sharetribe-process-visualizer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                        <Github className="h-4 w-4" />
                        Contribute on GitHub
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>

            <a href="#" target="_blank">
                <img src="https://hitwebcounter.com/counter/counter.php?page=21165776&style=0024&nbdigits=5&type=page&initCount=0" title="Counter Widget" Alt="Visit counter For Websites" border="0" />
            </a>

            {/* <a href="https://www.freecounterstat.com" title="free counter">
            <img src="https://counter1.optistats.ovh/private/freecounterstat.php?c=2yzbsppx2ub5az7zspla54h77bjrrxyg" border="0" title="free counter" alt="free counter"/>
            </a> */}
            </div>
        </div>
    );
};

export default Footer;


