"use client"

import { CheckIcon } from "lucide-react"

export function FormStepper({ currentStep, steps, onStepClick }) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={index} className="flex-1 relative">
            {/* Step connector */}
            {index > 0 && (
              <div 
                className={`absolute top-1/2 transform -translate-y-1/2 h-1 -mx-2 ${
                  currentStep > index ? 'bg-[var(--primary-red)]' : 'bg-gray-200'
                }`} 
                style={{ left: '-50%', right: '50%' }}
              ></div>
            )}
            
            {/* Step circle */}
            <button
              onClick={() => onStepClick(index)}
              className={`flex items-center justify-center w-10 h-10 rounded-full mx-auto
                ${currentStep === index 
                  ? 'bg-[var(--primary-red)] text-white border-[var(--primary-red)]' 
                  : currentStep > index 
                    ? 'bg-[var(--primary-red)] text-white border-[var(--primary-red)]' 
                    : 'bg-white text-gray-500 border-gray-300'}
                border-2 relative z-10 transition-colors duration-200
              `}
              disabled={currentStep < index}
            >
              {currentStep > index ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </button>
            
            {/* Step label */}
            <div className="text-center mt-2">
              <span 
                className={`text-sm font-medium ${
                  currentStep >= index ? 'text-[var(--primary-red)]' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}