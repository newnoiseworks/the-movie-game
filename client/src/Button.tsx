import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from '@chakra-ui/react'

interface ButtonProps extends ChakraButtonProps {
  /**
   * Button contents
   */
  label?: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

/**
 * Primary UI component for user interaction
 */
export const Button = ({
  label,
  children,
  ...props
}: ButtonProps) => {
  return (
    <ChakraButton
      type="button"
      colorScheme="purple"
      {...props}
    >
      {label || children}
    </ChakraButton>
  );
};
