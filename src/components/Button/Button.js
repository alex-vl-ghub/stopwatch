import styles from './Button.module.scss';

const Button = (props) => {
  const { clickHandler, children } = props;
  return <button className={styles.button} onClick={clickHandler}>{children}</button >;
};

export default Button;
