"use client"

import { useId, useState, useRef, useEffect, type InputHTMLAttributes, type ReactNode } from "react"

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: boolean
  hint?: ReactNode
  endAdornment?: ReactNode
  ref?: React.Ref<HTMLInputElement>
}

export function FloatingInput({
  label,
  error,
  hint,
  endAdornment,
  className = "",
  value,
  defaultValue,
  placeholder,
  ...props
}: FloatingInputProps) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const [val, setVal] = useState(defaultValue ?? value ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  const hasValue = typeof val === "string" ? val.length > 0 : val != null
  const hasDomValue = (inputRef.current?.value?.length ?? 0) > 0
  const float = focused || hasValue || hasDomValue

  useEffect(() => {
    if (inputRef.current && inputRef.current.value.length > 0 && !val) {
      setVal(inputRef.current.value)
    }
  }, [])

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          {...props}
          ref={(node) => {
            inputRef.current = node
            if (props.ref) {
              if (typeof props.ref === "function") props.ref(node)
              else (props.ref as React.MutableRefObject<HTMLInputElement | null>).current = node
            }
          }}
          className={`peer w-full rounded-xl border-2 bg-white px-4 pt-6 pb-2 text-sm text-slate-800 outline-none transition-all duration-200
            ${error
              ? "border-red-400 bg-red-50/30 focus:border-red-500"
              : "border-[#c1c7d0] focus:border-[#00517C]"
            }
            ${className}`}
          placeholder={focused ? (placeholder || " ") : " "}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          onChange={(e) => {
            setVal(e.currentTarget.value)
            props.onChange?.(e)
          }}
          onAnimationStart={(e) => {
            if (e.animationName === "onAutoFillStart") {
              setFocused(true)
            }
            props.onAnimationStart?.(e)
          }}
        />
        <label
          htmlFor={id}
          className={`absolute left-4 pointer-events-none transition-all duration-200
            ${float
              ? "top-2 text-xs font-semibold"
              : "top-1/2 -translate-y-1/2 text-sm font-medium"
            }
            ${error ? "text-red-500" : "text-[#00517C]"}
          `}
        >
          {label}
        </label>
        {endAdornment}
      </div>
      {hint !== undefined && (
        <div className="mt-1 min-h-[20px]">
          {hint}
        </div>
      )}
    </div>
  )
}
