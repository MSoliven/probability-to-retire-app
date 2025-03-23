import { Component, Input } from '@angular/core';
import { AbstractControl, ControlValueAccessor, Validators, Validator, ValidationErrors, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'choose-quantity',
  templateUrl:"./choose-quantity.component.html",
  styleUrls: ["./choose-quantity.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi:true,
      useExisting: ChooseQuantityComponent
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: ChooseQuantityComponent
    }
  ]
})

export class ChooseQuantityComponent implements ControlValueAccessor, Validator {

  quantityStr: string = "$";
  readOnly: boolean = false;
  disabled: boolean = false;

  @Input()
  increment: string = "1";

  @Input()
  decimals: string = "1";

  @Input()
  currency: string = "";

  @Input()
  minValue: string = "";

  @Input()
  tabindex: string = "";

  @Input()
  isReadOnly: string = "false";

  @Input()
  isDisabled: string = "false";

  ngOnInit(): void {
    this.readOnly = this.isReadOnly === "true";
    this.disabled = this.isDisabled === "true";
  }

  changeInput(e: any) {
      this.quantityStr = this.formatNumber(this.parseToNumber(e.target.value), Number(this.decimals)); 
      this.onChange(this.quantityStr);
  } 

  onChange = (quantityStr: string) => {
    this.quantityStr = quantityStr;
  };

  onTouched = () => {};

  touched = false;

  onAdd() {
    this.markAsTouched();
    if (!this.disabled) {
      var num = Number(this.quantityStr.replace(/[^0-9.-]+/g,""));
      num += Number(this.increment);
      this.quantityStr = this.formatNumber(num, Number(this.decimals));
      this.onChange(this.quantityStr);
    }
  }

  onRemove() {
    this.markAsTouched();
    var num = Number(this.quantityStr.replace(/[^0-9.-]+/g,""));
    if (!this.disabled && (this.minValue == "" || num > Number(this.minValue))) {
      num -= Number(this.increment);
      this.quantityStr = this.formatNumber(num, Number(this.decimals));
      this.onChange(this.quantityStr);
    }
  }

  writeValue(quantityStr: string) {
    this.quantityStr = quantityStr;
  }

  registerOnChange(onChange: any) {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any) {
    this.onTouched = onTouched;
  }

  markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }

  parseToNumber(quantityStr: string): number {
    var num = Number(quantityStr.replace(/[^0-9.-]+/g,""));
    return num;
  }

  formatNumber(num: number, dec: number): string {
    if (this.currency) {
      return this.currency + num.toLocaleString("en-US", {minimumFractionDigits: dec, maximumFractionDigits: dec});
    }
    return num.toLocaleString("en-US", {minimumFractionDigits: dec, maximumFractionDigits: dec});
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const num = this.parseToNumber(control.value);
    if (this.minValue != "" && num < Number(this.minValue)) {
      return {
        lessThanMinimum: {
          num
        }
      };
    }
    return null;
  }
}