import React from "react";
import {
    Accordion,
    AccordionItem,
    AccordionItemHeading,
    AccordionItemButton,
    AccordionItemPanel,
    AccordionItemState,
} from "react-accessible-accordion";
import "react-accessible-accordion/dist/fancy-example.css";
import { MdOutlineArrowDropDown } from "react-icons/md";

import "./Value.css";
import data from "../../utils/accordion";

const Value = () => {
    return (
        <section className="v-wrapper">
            <div className="paddings innerWidth flexCenter v-container">
                <div className="flexColStart v-left">
                    <div className="image-container">
                        <img src="/value.png" alt="Modern house with a dark facade and wooden panels" />
                    </div>
                </div>
                <div className="flexColStart v-right">
                    <span className="orangeText">Why Homyz</span>
                    <h2 className="primaryText">Find, save and visit homes in one place</h2>
                    <p className="secondaryText v-intro">
                        Homyz keeps your search simple: browse every listing, keep a shortlist and book viewings without phone calls.
                    </p>
                    <Accordion
                        className="accordion"
                        allowMultipleExpanded={false}
                        preExpanded={[0]}
                    >
                        {data.map((item, i) => {
                            return (
                                <AccordionItem className={`accordion-item`} key={i} uuid={i}>
                                    <AccordionItemHeading>
                                        <AccordionItemButton className="flexCenter accordion-button">
                                            <AccordionItemState>
                                                {({ expanded }) => {
                                                    const classname = expanded ? "expanded" : "collapsed";

                                                    return (
                                                        <>
                                                            <div className={`flexCenter icon ${classname}`} aria-hidden="true">
                                                                {item.icon}
                                                            </div>
                                                            <span className="primaryText accordion-heading">
                                                                {item.heading}
                                                            </span>
                                                            <div className={`flexCenter icon chevron ${classname}`} aria-hidden="true">
                                                                <MdOutlineArrowDropDown size={20} />
                                                            </div>
                                                        </>
                                                    );
                                                }}
                                            </AccordionItemState>
                                        </AccordionItemButton>
                                    </AccordionItemHeading>
                                    <AccordionItemPanel>
                                        <p className="secondaryText accordion-detail">{item.detail}</p>
                                    </AccordionItemPanel>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
            </div>
        </section>
    );
};

export default Value;
